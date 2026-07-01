-- Migration 20260701: Insert masterclass proposal for KOJ Interiors
-- Duplicated from the Mr. Gustavo / Forsite Creative proposal, with Module 3
-- ("Technical Specification Review Workflows") removed and remaining modules
-- renumbered.

INSERT INTO public.masterclass_proposals (
    slug,
    prepared_for,
    company_name,
    prepared_by,
    total_investment,
    agreement_pdf_url,
    duration,
    delivery_format,
    team_capacity,
    session_style,
    recommended_audience,
    modules,
    whats_included,
    expected_outcomes
) VALUES (
    'koj-interiors',
    'Dhouha Ali Ben Gouider',
    'KOJ INTERIORS',
    'Zkandar L.L.C',
    120000,
    '/zkandar-ai-masterclass-koj-interiors.pdf',
    '2-Day Masterclass (in-studio sessions) + 3rd Day Dedicated Support (scheduled post-masterclass, focused strictly on troubleshooting and implementation follow-up).',
    'In-Person, directly at your design studio.',
    'Up to 20 Participants.',
    'Highly interactive, hands-on application paired with on-screen visual presentation.',
    ARRAY[
        'Architects',
        'Interior Designers',
        'FF&E Teams',
        'Visualization Teams',
        'Design Directors',
        'Creative Leads',
        'Marketing Teams',
        'Concept Development Teams'
    ]::TEXT[],
    '[
        {
            "num": "01",
            "title": "AI Landscape & Tool Ecosystem",
            "icon": "Cpu",
            "topics": ["Text tools vs. image tools vs. video tools", "AI workflow mapping", "Strategic tool selection frameworks"]
        },
        {
            "num": "02",
            "title": "Claude Fundamentals & Prompt Craft",
            "icon": "PenTool",
            "topics": ["Context engineering", "Claude Projects architecture setup", "Prompt structure frameworks", "Feeding complex presentations, PDFs, references, and project documents", "Creating persistent workflow environments"]
        },
        {
            "num": "03",
            "title": "AI Image Generation Workflows",
            "icon": "ImageIcon",
            "topics": ["Nano Banana + Cinematic rendering workflows", "Multi-tool comparison frameworks", "Prompt quality guardrail systems", "MaterialScaping & Moodboard creation", "Iterative output refinement"]
        },
        {
            "num": "04",
            "title": "FF&E Development",
            "icon": "Layout",
            "topics": ["Bespoke object creation", "Furniture ideation systems", "Spatial placement workflows", "Contextual rendering systems"]
        },
        {
            "num": "05",
            "title": "The Art of Storytelling",
            "icon": "Sparkles",
            "topics": ["Narrative-driven image generation", "Creating unique fingerprint precedents", "Cinematic short film creation", "AI storytelling frameworks", "Emotional sequencing & atmosphere building", "Brand-focused marketing asset generation", "Client immersion", "Storyboarding & scene composition"]
        },
        {
            "num": "06",
            "title": "Prize Money Competition",
            "icon": "Award",
            "topics": ["High-fidelity Moodboards", "Customized FF&E Concepts", "Structured Narratives", "AI-generated technical Consultant Briefs"]
        }
    ]'::JSONB,
    ARRAY[
        'Custom studio-specific case studies mapped directly to your design aesthetic',
        'Real-time, in-session supervised hands-on practice',
        'Live team competition and gamified collaborative exercises',
        'Lifetime access to all session recordings',
        'Free proprietary e-prompt books and template kits',
        '60-day AI community support access',
        'Dedicated 3rd-day troubleshooting support session',
        'Data-driven team performance analysis reports'
    ]::TEXT[],
    ARRAY[
        'Flawless integration of production-ready AI systems into daily studio workflows',
        'Drastically compressed concept-to-presentation timelines',
        'Elevated client storytelling, pitching, and visual communication standards',
        'Significantly higher-quality creative concepts at unprecedented speeds',
        'Standardized, repeatable AI workflows across design and marketing departments',
        'Operational confidence presenting and explaining AI-assisted work to clients'
    ]::TEXT[]
)
ON CONFLICT (slug) DO NOTHING;
