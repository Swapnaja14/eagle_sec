from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db import models
from django.db.models import Count, Avg
from .models import Quiz, QuizQuestion, Submission, Answer
from .serializers import (
    QuizSerializer, QuizQuestionSerializer, 
    SubmissionSerializer, SubmitAnswerSerializer
)
from accounts.models import User


class QuizViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = QuizSerializer
    
    def get_queryset(self):
        qs = Quiz.objects.filter(is_active=True)
        if self.request.user.tenant:
            qs = qs.filter(tenant=self.request.user.tenant)
        
        course_id = self.request.query_params.get('course')
        if course_id:
            qs = qs.filter(course_id=course_id)
        
        return qs.prefetch_related('quiz_questions__question')
    
    def perform_create(self, serializer):
        serializer.save(
            tenant=self.request.user.tenant,
            created_by=self.request.user
        )
    
    @action(detail=True, methods=['post'])
    def start_quiz(self, request, pk=None):
        """Start a new quiz attempt"""
        quiz = self.get_object()
        user = request.user
        
        # Check max attempts
        attempts_count = Submission.objects.filter(user=user, quiz=quiz).count()
        if quiz.max_attempts > 0 and attempts_count >= quiz.max_attempts:
            return Response(
                {'error': f'Maximum attempts ({quiz.max_attempts}) reached'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create new submission
        submission = Submission.objects.create(
            user=user,
            quiz=quiz,
            attempt_number=attempts_count + 1,
            status='in_progress'
        )
        
        return Response(
            SubmissionSerializer(submission).data,
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=True, methods=['get'])
    def questions(self, request, pk=None):
        """Get quiz questions"""
        quiz = self.get_object()
        questions = quiz.quiz_questions.all()
        serializer = QuizQuestionSerializer(questions, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_question(self, request, pk=None):
        """Add a question to the quiz"""
        quiz = self.get_object()
        question_id = request.data.get('question_id')
        order = request.data.get('order', 0)
        points = request.data.get('points', 10)
        
        from questions.models import Question
        try:
            question = Question.objects.get(id=question_id)
        except Question.DoesNotExist:
            return Response(
                {'error': 'Question not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Create or update quiz question
        quiz_question, created = QuizQuestion.objects.update_or_create(
            quiz=quiz,
            question=question,
            defaults={'order': order, 'points': points}
        )
        
        return Response(
            QuizQuestionSerializer(quiz_question).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['get'])
    def trainers(self, request):
        """Get list of trainers for assignment"""
        trainers = User.objects.filter(
            role='instructor',
            tenant=request.user.tenant,
            is_active=True
        ).values('id', 'username', 'first_name', 'last_name', 'email')
        
        trainer_list = [
            {
                'id': t['id'],
                'name': f"{t['first_name']} {t['last_name']}".strip() or t['username'],
                'email': t['email']
            }
            for t in trainers
        ]
        
        return Response(trainer_list)


class SubmissionViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = SubmissionSerializer
    
    def get_queryset(self):
        qs = Submission.objects.filter(user=self.request.user)
        
        quiz_id = self.request.query_params.get('quiz')
        if quiz_id:
            qs = qs.filter(quiz_id=quiz_id)
        
        return qs.select_related('quiz', 'user').prefetch_related('answers')
    
    @action(detail=True, methods=['post'])
    def submit_answer(self, request, pk=None):
        """Submit an answer for a question"""
        submission = self.get_object()
        
        if submission.status != 'in_progress':
            return Response(
                {'error': 'Submission is not in progress'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = SubmitAnswerSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        question_id = serializer.validated_data['question_id']
        selected_answer = serializer.validated_data['selected_answer']
        
        # Get the question
        from questions.models import Question
        try:
            question = Question.objects.get(id=question_id)
            quiz_question = QuizQuestion.objects.get(quiz=submission.quiz, question=question)
        except (Question.DoesNotExist, QuizQuestion.DoesNotExist):
            return Response(
                {'error': 'Question not found in this quiz'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if correct
        is_correct = str(selected_answer).strip() == str(question.correct_answer).strip()
        points_earned = quiz_question.points if is_correct else 0
        
        # Save or update answer
        answer, created = Answer.objects.update_or_create(
            submission=submission,
            question=question,
            defaults={
                'quiz_question': quiz_question,
                'selected_answer': selected_answer,
                'is_correct': is_correct,
                'points_earned': points_earned
            }
        )
        
        return Response({
            'answer_id': answer.id,
            'is_correct': is_correct,
            'points_earned': points_earned
        })
    
    @action(detail=True, methods=['post'])
    def complete_submission(self, request, pk=None):
        """Complete and grade the submission"""
        submission = self.get_object()
        
        if submission.status != 'in_progress':
            return Response(
                {'error': 'Submission is already completed'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Calculate score
        answers = submission.answers.all()
        total_score = sum(answer.points_earned for answer in answers)
        total_points = sum(qq.points for qq in submission.quiz.quiz_questions.all())
        percentage = (total_score / total_points * 100) if total_points > 0 else 0
        
        # Calculate time taken
        time_taken = (timezone.now() - submission.started_at).total_seconds()
        
        # Update submission
        submission.score = total_score
        submission.total_points = total_points
        submission.percentage = percentage
        submission.passed = percentage >= submission.quiz.passing_score
        submission.status = 'completed'
        submission.submitted_at = timezone.now()
        submission.time_taken_seconds = int(time_taken)
        submission.save()
        
        return Response(SubmissionSerializer(submission).data)
    
    @action(detail=False, methods=['get'])
    def my_submissions(self, request):
        """Get current user's submissions"""
        submissions = self.get_queryset()
        serializer = self.get_serializer(submissions, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def all_submissions(self, request):
        """Get all submissions for admin/trainer view with filtering"""
        user = request.user
        
        # Only allow admin, trainer, or superadmin roles
        if user.role not in ['superadmin', 'admin', 'instructor']:
            return Response(
                {'error': 'Permission denied. Only admins and trainers can view all submissions.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Base queryset - filter by tenant for non-superadmins
        if user.role == 'superadmin':
            qs = Submission.objects.all()
        else:
            qs = Submission.objects.filter(user__tenant=user.tenant)
        
        # Apply filters from query params
        quiz_id = request.query_params.get('quiz')
        if quiz_id:
            qs = qs.filter(quiz_id=quiz_id)
        
        user_id = request.query_params.get('user')
        if user_id:
            qs = qs.filter(user_id=user_id)
        
        status_filter = request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        
        passed_filter = request.query_params.get('passed')
        if passed_filter is not None:
            qs = qs.filter(passed=passed_filter.lower() == 'true')
        
        date_from = request.query_params.get('date_from')
        if date_from:
            qs = qs.filter(submitted_at__gte=date_from)
        
        date_to = request.query_params.get('date_to')
        if date_to:
            qs = qs.filter(submitted_at__lte=date_to)
        
        # Search by user name or quiz title
        search = request.query_params.get('search')
        if search:
            qs = qs.filter(
                models.Q(user__username__icontains=search) |
                models.Q(user__first_name__icontains=search) |
                models.Q(user__last_name__icontains=search) |
                models.Q(quiz__title__icontains=search)
            )
        
        # Ordering
        ordering = request.query_params.get('ordering', '-submitted_at')
        qs = qs.order_by(ordering)
        
        # Pagination
        page_size = int(request.query_params.get('page_size', 50))
        page = int(request.query_params.get('page', 1))
        start = (page - 1) * page_size
        end = start + page_size
        total = qs.count()
        
        qs = qs[start:end]
        
        serializer = self.get_serializer(qs, many=True)
        return Response({
            'results': serializer.data,
            'count': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size
        })
