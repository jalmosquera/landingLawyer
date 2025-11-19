"""
Google Calendar API integration service.

This module handles OAuth2 authentication and CRUD operations
for Google Calendar events with Meet link generation.
"""

from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from django.conf import settings


class GoogleCalendarService:
    """
    Service for interacting with Google Calendar API.
    """

    def __init__(self, credentials=None):
        """
        Initialize the service with OAuth2 credentials.

        Args:
            credentials: OAuth2 credentials object or dict
        """
        self.credentials = credentials
        self.service = None
        if credentials:
            self._build_service()

    def _build_service(self):
        """Build the Google Calendar API service."""
        self.service = build('calendar', 'v3', credentials=self.credentials)

    @staticmethod
    def get_authorization_url(redirect_uri):
        """
        Get the OAuth2 authorization URL.

        Args:
            redirect_uri: Callback URL after authorization

        Returns:
            Authorization URL string
        """
        flow = Flow.from_client_config(
            {
                'web': {
                    'client_id': settings.GOOGLE_CLIENT_ID,
                    'client_secret': settings.GOOGLE_CLIENT_SECRET,
                    'auth_uri': 'https://accounts.google.com/o/oauth2/auth',
                    'token_uri': 'https://oauth2.googleapis.com/token',
                }
            },
            scopes=['https://www.googleapis.com/auth/calendar'],
            redirect_uri=redirect_uri
        )
        authorization_url, state = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true'
        )
        return authorization_url

    def create_event(self, summary, description, start_time, end_time, attendees=None):
        """
        Create a Google Calendar event with Meet link.

        Args:
            summary: Event title
            description: Event description
            start_time: Start datetime (timezone-aware)
            end_time: End datetime (timezone-aware)
            attendees: List of email addresses

        Returns:
            Dict with event_id and meet_link
        """
        event = {
            'summary': summary,
            'description': description,
            'start': {
                'dateTime': start_time.isoformat(),
                'timeZone': 'America/Mexico_City',
            },
            'end': {
                'dateTime': end_time.isoformat(),
                'timeZone': 'America/Mexico_City',
            },
            'conferenceData': {
                'createRequest': {
                    'requestId': f'meet-{start_time.timestamp()}',
                    'conferenceSolutionKey': {'type': 'hangoutsMeet'}
                }
            },
        }

        if attendees:
            event['attendees'] = [{'email': email} for email in attendees]

        created_event = self.service.events().insert(
            calendarId='primary',
            body=event,
            conferenceDataVersion=1
        ).execute()

        meet_link = created_event.get('hangoutLink')

        return {
            'event_id': created_event['id'],
            'meet_link': meet_link
        }

    def update_event(self, event_id, summary=None, description=None, start_time=None, end_time=None):
        """
        Update an existing Google Calendar event.

        Args:
            event_id: Google Calendar event ID
            summary: New event title
            description: New event description
            start_time: New start datetime
            end_time: New end datetime

        Returns:
            Updated event dict
        """
        # Get existing event
        event = self.service.events().get(calendarId='primary', eventId=event_id).execute()

        # Update fields if provided
        if summary:
            event['summary'] = summary
        if description:
            event['description'] = description
        if start_time:
            event['start']['dateTime'] = start_time.isoformat()
        if end_time:
            event['end']['dateTime'] = end_time.isoformat()

        updated_event = self.service.events().update(
            calendarId='primary',
            eventId=event_id,
            body=event
        ).execute()

        return updated_event

    def delete_event(self, event_id):
        """
        Delete a Google Calendar event.

        Args:
            event_id: Google Calendar event ID

        Returns:
            Boolean indicating success
        """
        try:
            self.service.events().delete(calendarId='primary', eventId=event_id).execute()
            return True
        except Exception as e:
            raise Exception(f"Error deleting event: {str(e)}")

    def list_events(self, time_min=None, time_max=None, max_results=10):
        """
        List calendar events within a time range.

        Args:
            time_min: Minimum time (datetime)
            time_max: Maximum time (datetime)
            max_results: Maximum number of events to return

        Returns:
            List of event dicts
        """
        params = {
            'calendarId': 'primary',
            'maxResults': max_results,
            'singleEvents': True,
            'orderBy': 'startTime',
        }

        if time_min:
            params['timeMin'] = time_min.isoformat()
        if time_max:
            params['timeMax'] = time_max.isoformat()

        events_result = self.service.events().list(**params).execute()
        events = events_result.get('items', [])

        return events
