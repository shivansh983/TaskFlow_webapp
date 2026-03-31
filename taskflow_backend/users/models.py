from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('manager', 'Manager'),
        ('staff', 'Staff'),
        ('helper', 'Helper'),
        ('member', 'Member'),
    ]
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='member')
    email = models.EmailField(unique=True, blank=False)
    
    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"