from rest_framework import serializers
from .models import Project, ProjectMember

class ProjectMemberSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = ProjectMember
        fields = ['id', 'user', 'username', 'email', 'role']

class ProjectSerializer(serializers.ModelSerializer):
    members_list = serializers.SerializerMethodField()
    user_role = serializers.SerializerMethodField()  # <-- add this

    class Meta:
        model = Project
        fields = '__all__'
        read_only_fields = ['created_by', 'created_at']

    def get_members_list(self, obj):
        members = ProjectMember.objects.filter(project=obj)
        return ProjectMemberSerializer(members, many=True).data

    def get_user_role(self, obj):
        user = self.context['request'].user
        try:
            member = ProjectMember.objects.get(project=obj, user=user)
            return member.role
        except ProjectMember.DoesNotExist:
            return None