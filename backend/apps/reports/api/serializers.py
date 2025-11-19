from rest_framework import serializers
from apps.reports.models import LegalReport


class LegalReportListSerializer(serializers.ModelSerializer):
    """
    Serializer for legal report list (minimal fields).
    """
    client_name = serializers.CharField(source='client.full_name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = LegalReport
        fields = ['id', 'title', 'client_name', 'status', 'created_by_name', 'file_size', 'created_at']
        read_only_fields = ['id', 'created_at']


class LegalReportDetailSerializer(serializers.ModelSerializer):
    """
    Serializer for legal report details.
    """
    client_name = serializers.CharField(source='client.full_name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    download_url = serializers.SerializerMethodField()

    class Meta:
        model = LegalReport
        fields = [
            'id', 'title', 'description', 'client', 'client_name',
            'pdf_file', 'file_size', 'file_hash', 'status',
            'created_by', 'created_by_name', 'download_url',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'file_hash', 'file_size', 'created_by', 'created_at', 'updated_at']

    def get_download_url(self, obj):
        from apps.reports.services import S3ReportService
        try:
            return S3ReportService.generate_presigned_url(obj.pdf_file.name)
        except Exception:
            return None


class LegalReportCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating legal reports with file upload.
    """

    class Meta:
        model = LegalReport
        fields = ['title', 'description', 'client', 'pdf_file', 'status']

    def validate_pdf_file(self, value):
        """Validate that the uploaded file is a PDF and within size limits."""
        if not value.name.endswith('.pdf'):
            raise serializers.ValidationError("Only PDF files are allowed.")

        # Max file size: 10MB
        max_size = 10 * 1024 * 1024
        if value.size > max_size:
            raise serializers.ValidationError("File size cannot exceed 10MB.")

        return value

    def create(self, validated_data):
        # Set the created_by from the request context
        validated_data['created_by'] = self.context['request'].user

        # Create the report instance
        report = LegalReport(**validated_data)

        # Calculate file size and hash
        report.file_size = validated_data['pdf_file'].size
        report.pdf_file = validated_data['pdf_file']
        report.save()

        # Calculate hash after file is saved
        report.file_hash = report.calculate_file_hash()
        report.save(update_fields=['file_hash'])

        return report
