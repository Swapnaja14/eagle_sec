from rest_framework import serializers
from .models import ContentFile, Tag


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name']


class ContentFileSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True, read_only=True)
    tag_names = serializers.ListField(child=serializers.CharField(), write_only=True, required=False)
    uploaded_by_name = serializers.SerializerMethodField()
    file_size_display = serializers.SerializerMethodField()

    class Meta:
        model = ContentFile
        fields = [
            'id', 'original_filename', 'file', 'file_type', 'file_size',
            'file_size_display', 'version', 'status', 'upload_date', 'updated_at',
            'title', 'description', 'thumbnail', 'duration', 'page_count', 'permissions',
            'subject', 'language', 'difficulty', 'tags', 'tag_names',
            'uploaded_by_name',
        ]
        read_only_fields = ['id', 'upload_date', 'updated_at', 'uploaded_by_name']

    def get_uploaded_by_name(self, obj):
        if obj.uploaded_by:
            return obj.uploaded_by.get_full_name() or obj.uploaded_by.username
        return None

    def get_file_size_display(self, obj):
        size = obj.file_size
        if size < 1024:
            return f"{size} B"
        elif size < 1024 ** 2:
            return f"{size / 1024:.1f} KB"
        elif size < 1024 ** 3:
            return f"{size / (1024 ** 2):.1f} MB"
        return f"{size / (1024 ** 3):.2f} GB"

    def create(self, validated_data):
        tag_names = validated_data.pop('tag_names', [])
        tenant = self.context['request'].user.tenant
        content_file = ContentFile.objects.create(tenant=tenant, **validated_data)

        for tag_name in tag_names:
            tag, _ = Tag.objects.get_or_create(name=tag_name.strip(), tenant=tenant)
            content_file.tags.add(tag)

        return content_file

    def update(self, instance, validated_data):
        tag_names = validated_data.pop('tag_names', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if tag_names is not None:
            instance.tags.clear()
            tenant = self.context['request'].user.tenant
            for tag_name in tag_names:
                tag, _ = Tag.objects.get_or_create(name=tag_name.strip(), tenant=tenant)
                instance.tags.add(tag)

        return instance
