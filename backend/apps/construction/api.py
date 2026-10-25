from rest_framework import serializers, viewsets
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import ConstructionMilestone, ConstructionShowcase


class ConstructionMilestoneSerializer(serializers.ModelSerializer):
    photo = serializers.ImageField(read_only=True)

    class Meta:
        model = ConstructionMilestone
        fields = '__all__'


class ConstructionMilestoneViewSet(viewsets.ModelViewSet):
    queryset = ConstructionMilestone.objects.all().order_by('stage_number', 'display_order')
    serializer_class = ConstructionMilestoneSerializer
    pagination_class = None

    def get_permissions(self):
        return [] if self.request.method in ('GET', 'HEAD', 'OPTIONS') else [IsAdminUser()]


class ConstructionShowcaseView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        showcase = ConstructionShowcase.objects.first()
        if showcase is None:
            return Response(
                {"success": False, "error": "La photo principale du chantier n'est pas configurée."},
                status=404,
            )
        return Response({
            "success": True,
            "data": {
                "title": showcase.title,
                "caption": showcase.caption,
                "photo": showcase.photo.url if showcase.photo else None,
            },
        })