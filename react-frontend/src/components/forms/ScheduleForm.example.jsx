import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { scheduleSchema } from '../../utils/validationSchemas';
import { FormField, FormSelect } from './FormField';
import { useCreateSchedule } from '../../hooks/useSchedules';
import { useToast } from '../common/ToastProvider';
import { ButtonLoader } from '../common/LoadingStates';

/**
 * Example: Schedule Form with React Hook Form and Zod validation
 * This demonstrates how to use the new form validation system
 */
const ScheduleForm = ({ initialData, onSuccess, onCancel }) => {
  const { showToast } = useToast();
  const createSchedule = useCreateSchedule();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    reset,
  } = useForm({
    resolver: zodResolver(scheduleSchema),
    defaultValues: initialData || {
      subject: '',
      day: '',
      startTime: '',
      endTime: '',
      instructor: '',
      room: '',
      course: '',
      year: '',
      section: '',
    },
  });

  const startTime = watch('startTime');
  const endTime = watch('endTime');

  const onSubmit = async (data) => {
    try {
      // Format time for API
      const scheduleData = {
        ...data,
        time: `${data.startTime} - ${data.endTime}`,
      };

      await createSchedule.mutateAsync(scheduleData);
      showToast('Schedule created successfully!', 'success');
      reset();
      if (onSuccess) onSuccess();
    } catch (error) {
      showToast(
        error.response?.data?.message || 'Failed to create schedule',
        'error'
      );
    }
  };

  // Day options
  const dayOptions = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
    'Monday/Wednesday',
    'Tuesday/Thursday',
  ];

  // Time options (example)
  const timeOptions = [
    '7:00 AM', '7:30 AM', '8:00 AM', '8:30 AM',
    '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM',
    '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
    '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
    '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM',
    '5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM',
    '7:00 PM', '7:30 PM', '8:00 PM',
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FormField
        label="Subject"
        name="subject"
        placeholder="Enter subject name"
        error={errors.subject}
        required
        register={register}
      />

      <FormSelect
        label="Day"
        name="day"
        placeholder="Select day"
        options={dayOptions}
        error={errors.day}
        required
        register={register}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <FormSelect
          label="Start Time"
          name="startTime"
          placeholder="Select start time"
          options={timeOptions}
          error={errors.startTime}
          required
          register={register}
        />

        <FormSelect
          label="End Time"
          name="endTime"
          placeholder="Select end time"
          options={timeOptions}
          error={errors.endTime}
          required
          register={register}
          helperText={
            startTime && endTime && startTime >= endTime
              ? 'End time must be after start time'
              : ''
          }
        />
      </div>

      <FormSelect
        label="Instructor"
        name="instructor"
        placeholder="Select instructor"
        options={[]} // Populate from API
        error={errors.instructor}
        required
        register={register}
      />

      <FormSelect
        label="Room"
        name="room"
        placeholder="Select room"
        options={[]} // Populate from API
        error={errors.room}
        required
        register={register}
      />

      <FormField
        label="Course"
        name="course"
        placeholder="Enter course"
        error={errors.course}
        required
        register={register}
      />

      <FormField
        label="Year"
        name="year"
        placeholder="Enter year"
        error={errors.year}
        required
        register={register}
      />

      <FormField
        label="Section"
        name="section"
        placeholder="Enter section"
        error={errors.section}
        required
        register={register}
      />

      <div style={{
        display: 'flex',
        gap: '12px',
        justifyContent: 'flex-end',
        marginTop: '24px',
      }}>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            style={{
              padding: '12px 24px',
              border: '2px solid #e5e7eb',
              background: 'white',
              borderRadius: '10px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              fontSize: '15px',
              fontWeight: '600',
              color: '#374151',
            }}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            padding: '12px 24px',
            background: 'linear-gradient(135deg, #0f2c63 0%, #1e40af 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            fontSize: '15px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {isSubmitting ? (
            <>
              <ButtonLoader />
              Creating...
            </>
          ) : (
            'Create Schedule'
          )}
        </button>
      </div>
    </form>
  );
};

export default ScheduleForm;

