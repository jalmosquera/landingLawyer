"""
API views for Users app.
"""

from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings

from core.permissions import IsStaff
from apps.users.models import User, PasswordResetToken
from .serializers import (
    UserSerializer,
    UserProfileSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer
)


class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet for User CRUD operations.
    Only staff (boss/employe) can access this endpoint.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsStaff]
    search_fields = ['username', 'email', 'name', 'phone']
    filterset_fields = ['role', 'is_staff', 'is_active']
    ordering = ['-date_joined']


class MeView(APIView):
    """
    View for authenticated user to get/update their own profile.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Get current user's profile.
        """
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        """
        Update current user's profile.
        """
        serializer = UserProfileSerializer(
            request.user,
            data=request.data,
            partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetRequestView(APIView):
    """
    Public endpoint to request password reset.
    Sends email with reset token.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        """
        Generate password reset token and send email.
        Always returns success (don't reveal if email exists).
        """
        serializer = PasswordResetRequestSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']

            try:
                user = User.objects.get(email=email)

                # Create reset token
                reset_token = PasswordResetToken.objects.create(user=user)

                # Prepare email
                context = {
                    'user_name': user.name,
                    'reset_token': reset_token.token,
                    'expires_at': reset_token.expires_at.strftime('%d/%m/%Y %H:%M'),
                    'lawyer_name': 'Eduardo Bernal Fernández',
                }

                # Render email template (will create this later)
                try:
                    html_message = render_to_string('emails/password_reset.html', context)
                except:
                    html_message = None

                # Send email
                send_mail(
                    subject='Restablecimiento de contraseña',
                    message=f"""
Estimado/a {user.name},

Ha solicitado restablecer su contraseña.

Su código de restablecimiento es: {reset_token.token}

Este código es válido hasta el {context['expires_at']}.

Si no solicitó este restablecimiento, ignore este correo.

Atentamente,
{context['lawyer_name']}
Colegiado ICAMA 4941
                    """,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[email],
                    html_message=html_message,
                    fail_silently=True,
                )

            except User.DoesNotExist:
                # Don't reveal if email exists - always return success
                pass

            return Response(
                {'message': 'Si el correo existe, recibirá instrucciones de restablecimiento'},
                status=status.HTTP_200_OK
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetConfirmView(APIView):
    """
    Public endpoint to confirm password reset with token.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        """
        Validate token and set new password.
        """
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if serializer.is_valid():
            token_str = serializer.validated_data['token']
            new_password = serializer.validated_data['new_password']

            try:
                token = PasswordResetToken.objects.get(token=token_str)

                if token.is_valid():
                    # Update password
                    user = token.user
                    user.set_password(new_password)
                    user.save()

                    # Mark token as used
                    token.used = True
                    token.save()

                    return Response(
                        {'message': 'Contraseña restablecida exitosamente'},
                        status=status.HTTP_200_OK
                    )
                else:
                    return Response(
                        {'error': 'Token expirado o ya utilizado'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            except PasswordResetToken.DoesNotExist:
                return Response(
                    {'error': 'Token inválido'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
