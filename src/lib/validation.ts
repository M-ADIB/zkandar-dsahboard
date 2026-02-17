import { z } from 'zod';

export const userRoleSchema = z.enum(['owner', 'admin', 'executive', 'participant']);

// Basic info schema for step 1 of onboarding
export const onboardingBasicInfoSchema = z.object({
    full_name: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    company_id: z.string().uuid('Invalid company selection'),
    age: z.coerce.number().min(18, 'You must be at least 18 years old').max(120, 'Please enter a valid age'),
    nationality: z.string().min(1, 'Nationality is required'),
});

// Full onboarding submission schema
export const onboardingSubmissionSchema = z.object({
    user_type: z.enum(['management', 'team']),
    basic_info: onboardingBasicInfoSchema,
    survey_answers: z.record(z.union([
        z.string(),
        z.array(z.string()),
        z.number(),
        z.record(z.number())
    ])),
});

export const userProfileSchema = onboardingBasicInfoSchema.pick({
    full_name: true,
});

export type OnboardingBasicInfo = z.infer<typeof onboardingBasicInfoSchema>;
export type OnboardingSubmission = z.infer<typeof onboardingSubmissionSchema>;
export type UserProfileUpdate = z.infer<typeof userProfileSchema>;
