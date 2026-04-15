from rest_framework import serializers
from .models import Quiz, QuizQuestion, Submission, Answer
from questions.serializers import QuestionSerializer


class QuizQuestionSerializer(serializers.ModelSerializer):
    question = QuestionSerializer(read_only=True)
    question_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = QuizQuestion
        fields = ['id', 'question', 'question_id', 'order', 'points']


class QuizSerializer(serializers.ModelSerializer):
    quiz_questions = QuizQuestionSerializer(many=True, read_only=True)
    total_questions = serializers.SerializerMethodField()
    total_points = serializers.SerializerMethodField()
    assigned_trainers = serializers.PrimaryKeyRelatedField(many=True, read_only=True)
    assigned_trainer_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )
    assigned_trainer_names = serializers.SerializerMethodField()
    
    class Meta:
        model = Quiz
        fields = [
            'id', 'title', 'description', 'course', 'time_limit_minutes',
            'passing_score', 'max_attempts', 'randomize_questions',
            'show_correct_answers', 'is_active', 'created_at', 'updated_at',
            'quiz_questions', 'total_questions', 'total_points',
            'assigned_trainers', 'assigned_trainer_ids', 'assigned_trainer_names'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_total_questions(self, obj):
        return obj.quiz_questions.count()
    
    def get_total_points(self, obj):
        return sum(qq.points for qq in obj.quiz_questions.all())
    
    def get_assigned_trainer_names(self, obj):
        return [
            {'id': trainer.id, 'name': trainer.get_full_name() or trainer.username, 'email': trainer.email}
            for trainer in obj.assigned_trainers.all()
        ]
    
    def create(self, validated_data):
        trainer_ids = validated_data.pop('assigned_trainer_ids', [])
        quiz = Quiz.objects.create(**validated_data)
        if trainer_ids:
            quiz.assigned_trainers.set(trainer_ids)
        return quiz
    
    def update(self, instance, validated_data):
        trainer_ids = validated_data.pop('assigned_trainer_ids', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if trainer_ids is not None:
            instance.assigned_trainers.set(trainer_ids)
        return instance


class AnswerSerializer(serializers.ModelSerializer):
    question_text = serializers.CharField(source='question.text', read_only=True)
    
    class Meta:
        model = Answer
        fields = ['id', 'question', 'question_text', 'selected_answer', 'is_correct', 'points_earned', 'answered_at']
        read_only_fields = ['is_correct', 'points_earned', 'answered_at']


class SubmissionSerializer(serializers.ModelSerializer):
    answers = AnswerSerializer(many=True, read_only=True)
    user_name = serializers.CharField(source='user.username', read_only=True)
    quiz_title = serializers.CharField(source='quiz.title', read_only=True)
    
    class Meta:
        model = Submission
        fields = [
            'id', 'user', 'user_name', 'quiz', 'quiz_title', 'attempt_number',
            'score', 'total_points', 'percentage', 'status', 'started_at',
            'submitted_at', 'time_taken_seconds', 'passed', 'answers'
        ]
        read_only_fields = ['score', 'total_points', 'percentage', 'passed', 'started_at', 'submitted_at']


class SubmitAnswerSerializer(serializers.Serializer):
    question_id = serializers.IntegerField()
    selected_answer = serializers.CharField()
