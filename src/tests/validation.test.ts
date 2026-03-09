import { describe, it, expect } from 'vitest'
import {
    userProfileSchema,
    onboardingBasicInfoSchema,
    onboardingSubmissionSchema,
} from '@/lib/validation'

describe('userProfileSchema', () => {
    it('accepts a valid full name', () => {
        const result = userProfileSchema.safeParse({ full_name: 'Alice Smith' })
        expect(result.success).toBe(true)
    })

    it('rejects a name shorter than 2 characters', () => {
        const result = userProfileSchema.safeParse({ full_name: 'A' })
        expect(result.success).toBe(false)
        expect(result.error?.errors[0].message).toBe('Full name must be at least 2 characters')
    })

    it('rejects an empty full name', () => {
        const result = userProfileSchema.safeParse({ full_name: '' })
        expect(result.success).toBe(false)
    })
})

describe('onboardingBasicInfoSchema', () => {
    const validPayload = {
        full_name: 'Bob Jones',
        email: 'bob@example.com',
        company_id: '00000000-0000-0000-0000-000000000001',
        age: 30,
        nationality: 'British',
    }

    it('accepts a valid payload', () => {
        const result = onboardingBasicInfoSchema.safeParse(validPayload)
        expect(result.success).toBe(true)
    })

    it('rejects an invalid email', () => {
        const result = onboardingBasicInfoSchema.safeParse({ ...validPayload, email: 'not-an-email' })
        expect(result.success).toBe(false)
        expect(result.error?.errors[0].message).toBe('Invalid email address')
    })

    it('rejects age below 18', () => {
        const result = onboardingBasicInfoSchema.safeParse({ ...validPayload, age: 17 })
        expect(result.success).toBe(false)
        expect(result.error?.errors[0].message).toBe('You must be at least 18 years old')
    })

    it('rejects a non-UUID company_id', () => {
        const result = onboardingBasicInfoSchema.safeParse({ ...validPayload, company_id: 'bad-id' })
        expect(result.success).toBe(false)
    })

    it('coerces a string age to a number', () => {
        const result = onboardingBasicInfoSchema.safeParse({ ...validPayload, age: '25' })
        expect(result.success).toBe(true)
        if (result.success) expect(result.data.age).toBe(25)
    })
})

describe('onboardingSubmissionSchema', () => {
    it('accepts a valid submission', () => {
        const result = onboardingSubmissionSchema.safeParse({
            user_type: 'management',
            basic_info: {
                full_name: 'Carol White',
                email: 'carol@corp.com',
                company_id: '00000000-0000-0000-0000-000000000002',
                age: 40,
                nationality: 'Canadian',
            },
            survey_answers: { q1: 'yes', q2: ['a', 'b'], score: 5 },
        })
        expect(result.success).toBe(true)
    })

    it('rejects an invalid user_type', () => {
        const result = onboardingSubmissionSchema.safeParse({
            user_type: 'superuser',
            basic_info: {},
            survey_answers: {},
        })
        expect(result.success).toBe(false)
    })
})
