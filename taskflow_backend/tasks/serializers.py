from rest_framework import serializers
from .models import Task

class TaskSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = ['id', 'title', 'description', 'status', 'priority', 'due_date', 'assigned_to', 'assigned_to_name', 'project', 'created_at', 'updated_at', 'comments']
        read_only_fields = ['created_at', 'updated_at']

    def get_assigned_to_name(self, obj):
        return obj.assigned_to.username if obj.assigned_to else None