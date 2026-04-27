export interface CaseStudySlide {
    img?: string
    vimeoId?: string
    stepLabel: string
    category: string
    title: string
    caption: string
}

export interface CaseStudy {
    id: string
    name: string
    role: string
    projectType: string
    location: string
    tagline: string
    dp: string
    previewImgs: string[]
    slides: CaseStudySlide[]
}

export const WORKSHOPS = [
    { num: 1,  id: '1113394139', label: 'Sprint Workshop 1' },
    { num: 2,  id: '1113394104', label: 'Sprint Workshop 2' },
    { num: 3,  id: '1113394254', label: 'Sprint Workshop 3' },
    { num: 4,  id: '1113394271', label: 'Sprint Workshop 4' },
    { num: 5,  id: '1113394244', label: 'Sprint Workshop 5' },
    { num: 6,  id: '1113394028', label: 'Sprint Workshop 6' },
    { num: 7,  id: '1141677962', label: 'Sprint Workshop 7' },
    { num: 8,  id: '1141677978', label: 'Sprint Workshop 8' },
    { num: 9,  id: '1183473523', label: 'Sprint Workshop 9' },
]

export const CASE_STUDIES: CaseStudy[] = [
    // ── 1. LOGAN ───────────────────────────────────────────────────────────────
    {
        id: 'logan',
        name: 'Logan',
        role: 'F&B Hospitality Consultant',
        projectType: 'F&B Branding & Concept',
        location: 'Europe · Riyadh',
        tagline: 'Three landmark hospitality projects — from a Mediterranean restaurant to St. Regis Riyadh — all AI-assisted.',
        dp: '/casestudies/logan/dp.jpg',
        previewImgs: [
            '/casestudies/logan/almina/1.jpg',
            '/casestudies/logan/flamboyant/1.jpg',
            '/casestudies/logan/st-regis/1.jpg',
            '/casestudies/logan/almina/5.jpg',
        ],
        slides: [
            { img: '/casestudies/logan/almina/1.jpg',   stepLabel: 'A·01', category: 'Almina — Cascais',    title: 'Brand Identity',       caption: 'Almina: a contemporary Levantine–Mediterranean restaurant in Cascais. Branding, naming, and culinary concept — AI-assisted from day one.' },
            { img: '/casestudies/logan/almina/2.jpg',   stepLabel: 'A·02', category: 'Almina — Cascais',    title: 'Visual Direction',     caption: '' },
            { img: '/casestudies/logan/almina/3.jpg',   stepLabel: 'A·03', category: 'Almina — Cascais',    title: 'Concept Narrative',    caption: '' },
            { img: '/casestudies/logan/almina/4.jpg',   stepLabel: 'A·04', category: 'Almina — Cascais',    title: 'Menu Design',          caption: '' },
            { img: '/casestudies/logan/almina/5.jpg',   stepLabel: 'A·05', category: 'Almina — Cascais',    title: 'Collaterals',          caption: '' },
            { img: '/casestudies/logan/almina/6.jpg',   stepLabel: 'A·06', category: 'Almina — Cascais',    title: 'Uniforms & Signage',   caption: '' },
            { img: '/casestudies/logan/almina/7.jpg',   stepLabel: 'A·07', category: 'Almina — Cascais',    title: 'Illustration',         caption: '' },
            { img: '/casestudies/logan/almina/8.jpg',   stepLabel: 'A·08', category: 'Almina — Cascais',    title: 'Graphic Design',       caption: '' },
            { img: '/casestudies/logan/almina/9.jpg',   stepLabel: 'A·09', category: 'Almina — Cascais',    title: 'Final Output 01',      caption: '' },
            { img: '/casestudies/logan/almina/10.jpg',  stepLabel: 'A·10', category: 'Almina — Cascais',    title: 'Final Output 02',      caption: 'Complete brand ecosystem — positioned to stand apart in the Cascais dining landscape.' },
            { img: '/casestudies/logan/flamboyant/1.jpg', stepLabel: 'F·01', category: 'Flamboyant — Pyrenees', title: 'Concept Creation',   caption: 'Flamboyant: a fire-driven dining experience at Casino Capvern — inspired by the rich local products of the Pyrenees. 140 seats, 4 distinct areas.' },
            { img: '/casestudies/logan/flamboyant/2.jpg', stepLabel: 'F·02', category: 'Flamboyant — Pyrenees', title: 'Naming & Trademark', caption: '' },
            { img: '/casestudies/logan/flamboyant/3.jpg', stepLabel: 'F·03', category: 'Flamboyant — Pyrenees', title: 'Menu Development',   caption: '' },
            { img: '/casestudies/logan/flamboyant/4.jpg', stepLabel: 'F·04', category: 'Flamboyant — Pyrenees', title: 'F&B Programming',    caption: '' },
            { img: '/casestudies/logan/flamboyant/5.jpg', stepLabel: 'F·05', category: 'Flamboyant — Pyrenees', title: 'Copy & Branding',    caption: '' },
            { img: '/casestudies/logan/flamboyant/6.jpg', stepLabel: 'F·06', category: 'Flamboyant — Pyrenees', title: 'Visual Identity',    caption: '' },
            { img: '/casestudies/logan/flamboyant/7.jpg', stepLabel: 'F·07', category: 'Flamboyant — Pyrenees', title: 'Final Direction 01', caption: '' },
            { img: '/casestudies/logan/flamboyant/8.jpg', stepLabel: 'F·08', category: 'Flamboyant — Pyrenees', title: 'Final Direction 02', caption: 'Rustic elegance meets vibrant, smoky flavors — tailor-made braseros at the center.' },
            { img: '/casestudies/logan/st-regis/1.jpg',  stepLabel: 'R·01', category: 'St. Regis — Riyadh', title: 'DINE EXQUISITE',      caption: 'Collaborated with The St. Regis Riyadh on DINE EXQUISITE — a bespoke catering concept extending the hotel\'s universe beyond its walls.' },
            { img: '/casestudies/logan/st-regis/2.jpg',  stepLabel: 'R·02', category: 'St. Regis — Riyadh', title: 'Concept Narrative',   caption: '' },
            { img: '/casestudies/logan/st-regis/3.jpg',  stepLabel: 'R·03', category: 'St. Regis — Riyadh', title: 'Brand Creation',      caption: '' },
            { img: '/casestudies/logan/st-regis/4.jpeg',  stepLabel: 'R·04', category: 'St. Regis — Riyadh', title: 'Visual Identity',     caption: '' },
            { img: '/casestudies/logan/st-regis/5.jpeg',  stepLabel: 'R·05', category: 'St. Regis — Riyadh', title: 'Illustration System', caption: '' },
            { img: '/casestudies/logan/st-regis/6.jpeg',  stepLabel: 'R·06', category: 'St. Regis — Riyadh', title: 'Printed Collaterals', caption: '' },
            { img: '/casestudies/logan/st-regis/7.jpg',  stepLabel: 'R·07', category: 'St. Regis — Riyadh', title: 'Packaging',           caption: '' },
            { img: '/casestudies/logan/st-regis/8.jpg',  stepLabel: 'R·08', category: 'St. Regis — Riyadh', title: 'Merchandising',       caption: 'A visual and experiential language adapted to private events across Riyadh — St. Regis standards, beyond the hotel.' },
        ],
    },

    // ── 2. AKSHAY ──────────────────────────────────────────────────────────────
    {
        id: 'akshay',
        name: 'Akshay',
        role: 'Founder — b.form',
        projectType: 'Product & Furniture Design',
        location: 'India',
        tagline: 'Every furniture piece was generated by AI — then manufactured and presented at a live design event.',
        dp: '/casestudies/akshay/dp.jpg',
        previewImgs: [
            '/casestudies/akshay/1.jpg',
            '/casestudies/akshay/3.jpg',
            '/casestudies/akshay/5.jpg',
            '/casestudies/akshay/6.jpg',
        ],
        slides: [
            { img: '/casestudies/akshay/1.jpg', stepLabel: '01', category: 'b.form Collection', title: 'Piece 01', caption: 'All furniture items were generated via AI and then manufactured and presented at the Design Event.' },
            { img: '/casestudies/akshay/2.jpg', stepLabel: '02', category: 'b.form Collection', title: 'Piece 02', caption: '' },
            { img: '/casestudies/akshay/3.jpg', stepLabel: '03', category: 'b.form Collection', title: 'Piece 03', caption: '' },
            { img: '/casestudies/akshay/4.jpg', stepLabel: '04', category: 'b.form Collection', title: 'Piece 04', caption: '' },
            { img: '/casestudies/akshay/5.jpg', stepLabel: '05', category: 'b.form Collection', title: 'Piece 05', caption: '' },
            { img: '/casestudies/akshay/6.jpg', stepLabel: '06', category: 'b.form Collection', title: 'Piece 06', caption: 'The full collection — AI-generated, physically manufactured, publicly exhibited.' },
        ],
    },

    // ── 3. NISREEN ─────────────────────────────────────────────────────────────
    {
        id: 'nisreen',
        name: 'Nisreen Kayyali',
        role: 'Founder — Nisreen Kayyali Consulting Engineers',
        projectType: 'Commercial Architecture',
        location: 'Riyadh, Saudi Arabia',
        tagline: 'From a Google Earth satellite image to a fully rendered building. Every step AI-directed.',
        dp: '/casestudies/nisreen/dp.jpg',
        previewImgs: [
            '/casestudies/nisreen/4.jpg',
            '/casestudies/nisreen/1.jpg',
            '/casestudies/nisreen/11.jpg',
            '/casestudies/nisreen/6.jpg',
        ],
        slides: [
            { img: '/casestudies/nisreen/1.jpg',  stepLabel: '01', category: 'The Site',    title: 'Marking the Site',          caption: '1st step — Mark the site directly on a Google Earth image. The starting point before any design begins.' },
            { img: '/casestudies/nisreen/2.jpg',  stepLabel: '02', category: 'The Design',  title: 'AI Site Axonometric',       caption: '2nd step — Create an axonometric view of the site using AI. The full context mapped in one prompt.' },
            { img: '/casestudies/nisreen/3.jpg',  stepLabel: '03', category: 'The Design',  title: 'Eye-Level View',            caption: '3rd step — Bring the view down to eye level using AI. The building begins to feel real.' },
            { img: '/casestudies/nisreen/4.jpg',  stepLabel: '04', category: 'Hero Render', title: 'The Money Shot',            caption: '4th step — Prompt with intent to get the money shot. Photorealistic. Client-ready.' },
            { img: '/casestudies/nisreen/5.jpg',  stepLabel: '05', category: 'Details',     title: 'Entrance Detail',           caption: 'Generate a detail shot of the entrance. AI zooms in on the exact moment that sells the project.' },
            { img: '/casestudies/nisreen/6.jpg',  stepLabel: '06', category: 'Details',     title: 'Facade Material',           caption: 'Generate a detail shot of the facade material. Texture, depth, and surface quality — all AI-directed.' },
            { img: '/casestudies/nisreen/7.jpg',  stepLabel: '07', category: 'Wayfinding',  title: 'Wayfinding Design',         caption: 'Generate wayfinding design consistent to the context. Brand-integrated signage in one prompt.' },
            { img: '/casestudies/nisreen/8.jpg',  stepLabel: '08', category: 'Context',     title: 'Parking Area',              caption: 'Expose new territory within the image — like the parking area. AI reveals what traditional renders skip.' },
            { img: '/casestudies/nisreen/9.jpg',  stepLabel: '09', category: 'Details',     title: 'Lightpost Detail',          caption: 'Demonstrating the ability to show detail shots of lightposts. Every element of the project visualized.' },
            { img: '/casestudies/nisreen/10.jpg', stepLabel: '10', category: 'Context',     title: 'The Villa Side',            caption: 'Using the Transcend Method, we travel to the villa side. AI navigates the full perimeter of the project.' },
            { img: '/casestudies/nisreen/11.jpg', stepLabel: '11', category: 'Interiors',   title: 'Interior Shots',            caption: 'Finally, generate interior shots of the structure. Every space visualized — without a single model built.' },
        ],
    },

    // ── 4. ALEENA ──────────────────────────────────────────────────────────────
    {
        id: 'aleena',
        name: 'Aleena Al Waqas',
        role: 'Founder — Known Design',
        projectType: 'Hospitality Interior Design',
        location: 'UAE',
        tagline: 'A full coffee bar concept generated from one single prompt — then explored in every detail.',
        dp: '/casestudies/aleena/dp.jpeg',
        previewImgs: [
            '/casestudies/aleena/1.jpg',
            '/casestudies/aleena/4.jpg',
            '/casestudies/aleena/7.jpg',
            '/casestudies/aleena/8.jpg',
        ],
        slides: [
            { img: '/casestudies/aleena/1.jpg',   stepLabel: '01', category: 'Overview',  title: 'Coffee Bar — One Prompt',       caption: 'Generated a complete coffee bar concept from scratch in one single prompt. Spatial layout, atmosphere, and materiality — all in.' },
            { img: '/casestudies/aleena/2.jpg',   stepLabel: '02', category: 'Moments',   title: 'Transcend the Space',           caption: 'Transcend and capture moments on the coffee bar. AI moves through the space, finding the angles that tell the story.' },
            { img: '/casestudies/aleena/3.jpg',   stepLabel: '03', category: 'Details',   title: 'Pendant Light',                 caption: 'Generate close up shots of the pendant light. Lighting fixtures visualized at photographic quality.' },
            { img: '/casestudies/aleena/4.jpg',   stepLabel: '04', category: 'Details',   title: 'Seating Area',                  caption: 'Generate close up shots of the seating area. Fabric, form, and spatial feel — all AI-directed.' },
            { img: '/casestudies/aleena/5.jpg',   stepLabel: '05', category: 'Details',   title: 'Armchair Close-Up',             caption: 'Generate a close up shot of the armchair. Material accuracy and shadow depth at render quality.' },
            { img: '/casestudies/aleena/6.jpeg',  stepLabel: '06', category: 'Details',   title: 'Flooring & Terminations',       caption: 'Generate a close up shot of the flooring and terminations. The finishing details that close a design.' },
            { img: '/casestudies/aleena/7.jpg',   stepLabel: '07', category: 'Details',   title: 'Bar Counter',                   caption: 'Showcase bar counter details. Edge profiles, material transitions, and surface texture — all in one prompt.' },
            { img: '/casestudies/aleena/8.jpg',   stepLabel: '08', category: 'Details',   title: 'Wall Finishing',                caption: 'Expose details of the wall finishing. The full material palette of the project rendered at close range.' },
        ],
    },

    // ── 5. NANCY ───────────────────────────────────────────────────────────────
    {
        id: 'nancy',
        name: 'Nancy',
        role: 'Senior Interior Designer — FINASI',
        projectType: 'Product Design',
        location: 'UAE',
        tagline: '1st place at the Masterclass prize competition. One armchair. Designed, detailed, and presented entirely with AI.',
        dp: '/casestudies/nancy/dp.jpg',
        previewImgs: [
            '/casestudies/nancy/8.jpg',
            '/casestudies/nancy/1.jpg',
            '/casestudies/nancy/3.jpg',
            '/casestudies/nancy/6.jpg',
        ],
        slides: [
            { img: '/casestudies/nancy/1.jpg',   stepLabel: '01', category: 'The Brief',   title: 'Interior Context',          caption: 'The brief: design an armchair and place it in this AI-generated interior. The starting point.' },
            { img: '/casestudies/nancy/2.jpeg',  stepLabel: '02', category: 'Generation',  title: 'Armchair from Prompts',     caption: 'Armchair generation based on prompts alone. Form, proportion, and material — all directed through AI.' },
            { img: '/casestudies/nancy/3.jpg',   stepLabel: '03', category: 'Exploration', title: 'Multiple Sides',            caption: 'Capturing different sides of the armchair. AI explores every angle of the design in minutes.' },
            { img: '/casestudies/nancy/4.jpg',   stepLabel: '04', category: 'Details',     title: 'Steel Leg Detail',          caption: 'Capturing detail shots of the steel legs. Material accuracy and precision at photographic quality.' },
            { img: '/casestudies/nancy/5.jpg',   stepLabel: '05', category: 'Details',     title: 'Back Seat & Texture',       caption: 'Back seat details and textures. Every surface studied and rendered through AI prompts.' },
            { img: '/casestudies/nancy/6.jpg',   stepLabel: '06', category: 'Moodboard',   title: 'Moodboard Creations',       caption: 'Moodboard creations built around the armchair. Materiality, palette, and context — all composed by AI.' },
            { img: '/casestudies/nancy/7.jpg',   stepLabel: '07', category: 'Technical',   title: 'Armchair Diagrams',         caption: 'Generating technical diagrams of the armchair. AI produces the documentation alongside the renders.' },
            { img: '/casestudies/nancy/8.jpg',   stepLabel: '08', category: 'Final',       title: 'The Money Shot',            caption: 'The money shot — the armchair placed in context. This image won 1st place at the Masterclass prize competition.' },
        ],
    },

    // ── 6. SULTAN ──────────────────────────────────────────────────────────────
    {
        id: 'sultan',
        name: 'Sultan',
        role: 'Jr. Interior Designer — Revie Spaces',
        projectType: 'Interior Design',
        location: 'UAE',
        tagline: 'From a conceptual armchair to a full interior story — every image AI-generated, end to end.',
        dp: '/casestudies/sultan/dp.jpeg',
        previewImgs: [
            '/casestudies/sultan/2.jpg',
            '/casestudies/sultan/1.jpg',
            '/casestudies/sultan/5.jpg',
            '/casestudies/sultan/8.jpg',
        ],
        slides: [
            { img: '/casestudies/sultan/1.jpg', stepLabel: '01', category: 'Generation',  title: 'Conceptual Armchair',       caption: 'Generated an image of a conceptual armchair. The idea formed entirely through AI prompting.' },
            { img: '/casestudies/sultan/2.jpg', stepLabel: '02', category: 'Context',     title: 'Real-Life Context',         caption: 'Transformed the armchair into a real life interior context. The piece is now living in a space.' },
            { img: '/casestudies/sultan/3.jpg', stepLabel: '03', category: 'Details',     title: 'Armchair Details',          caption: 'Captured details of the armchair. Material quality and surface texture rendered at close range.' },
            { img: '/casestudies/sultan/4.jpg', stepLabel: '04', category: 'Exploration', title: 'Transcend the Space',       caption: 'Showcasing the ability to transcend and expose new details in the space. AI navigates the interior freely.' },
            { img: '/casestudies/sultan/5.jpg', stepLabel: '05', category: 'Details',     title: 'Floor Lamp',                caption: 'Close up shot of the floor lamp. AI zooms into any element and renders it at photographic quality.' },
            { img: '/casestudies/sultan/6.jpg', stepLabel: '06', category: 'Details',     title: 'Sofa & Painting',           caption: 'Close up shot of the sofa with the painting. Every object in the room explored and documented.' },
            { img: '/casestudies/sultan/7.jpg', stepLabel: '07', category: 'Details',     title: 'Table Details',             caption: 'Capturing details laid on the table. Styling, material, and light — all AI-directed.' },
            { img: '/casestudies/sultan/8.jpg', stepLabel: '08', category: 'Final',       title: 'Moodboard Full Circle',     caption: 'Moodboard full circle. The complete interior story — from one conceptual armchair to a fully realized space.' },
        ],
    },
]
