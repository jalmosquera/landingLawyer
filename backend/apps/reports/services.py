from datetime import timedelta
from django.utils import timezone
from django.core.files.storage import default_storage


class S3ReportService:
    """
    Service for handling S3 operations for legal reports.
    """

    @staticmethod
    def generate_presigned_url(file_path, expiration=3600):
        """
        Generate a pre-signed URL for downloading a file from S3.

        Args:
            file_path: Path to the file in S3
            expiration: URL expiration time in seconds (default: 1 hour)

        Returns:
            Pre-signed URL string
        """
        try:
            url = default_storage.url(file_path, expire=expiration)
            return url
        except Exception as e:
            raise Exception(f"Error generating pre-signed URL: {str(e)}")

    @staticmethod
    def delete_file(file_path):
        """
        Delete a file from S3.

        Args:
            file_path: Path to the file in S3

        Returns:
            Boolean indicating success
        """
        try:
            default_storage.delete(file_path)
            return True
        except Exception as e:
            raise Exception(f"Error deleting file: {str(e)}")
