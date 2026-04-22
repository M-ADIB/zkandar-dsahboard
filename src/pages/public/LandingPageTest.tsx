import { useRef, useState, useEffect } from 'react'
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion'
import {
    Eye, ArrowRight, Building2,
    X, ZoomIn, ZoomOut,
    ChevronLeft, ChevronRight, Play,
} from 'lucide-react'
import logoSrc from '../../assets/logo.png'
import { PublicNav } from '../../components/public/PublicNav'

// ─── Data ─────────────────────────────────────────────────────────────────────


const TRADITIONAL_STEPS = [
    { num: '01', label: 'The Sketch',          img: '/lander/2.png',  caption: 'A hand-drawn concept. The starting point for every design.' },
    { num: '02', label: 'Massing Analysis',    img: '/lander/3.png',  caption: 'Weeks of analysis to understand the site and program.' },
    { num: '03', label: 'Visualization',       img: '/lander/15.png', caption: 'Final renders. Months of work. One direction committed.' },
]

// 11 images — clean 4-col grid: rows 1-2 share the big feature, row 3 has the wide+tall combo, row 4 is even
const GALLERY_ITEMS = [
    { label: 'Night Entrance',  img: '/lander/24.png', cls: 'col-span-2 row-span-2' }, // cinematic entrance close-up
    { label: 'Arch Detail',     img: '/lander/26.png', cls: '' },                       // stone arch with S.O.M. sign
    { label: 'Reflecting Pool', img: '/lander/27.png', cls: '' },                       // pool reflection at night
    { label: 'Interior Hall',   img: '/lander/30.png', cls: 'row-span-2' },             // grand colosseum interior with torches
    { label: 'Section Cut',     img: '/lander/13.png', cls: '' },                       // facade cutaway
    { label: 'Wide Entrance',   img: '/lander/4.png',  cls: 'col-span-2' },             // definitive S.O.M. entrance — full width, cypress + reflecting pool
    { label: 'Concept Sketch',  img: '/lander/33.png', cls: '' },                       // white-line concept sketch on blue
    { label: 'Materials',       img: '/lander/32.png', cls: '' },                       // S.O.M. editorial detail collage
    { label: 'Construction',    img: '/lander/9.png',  cls: '' },                       // aerial night construction tilt-shift
    { label: 'Arena',           img: '/lander/1.png',  cls: '' },                       // gladiator crowd scene
    { label: 'Armor Detail',    img: '/lander/31.png', cls: '' },                       // gladiator armor close-up
]

const CAPABILITIES = [
    {
        num: '01', title: 'Generate Detail Shots',
        img: '/lander/8.png',
        copy: 'AI produces photorealistic close-ups of any material, texture, or architectural element. On demand.',
    },
    {
        num: '02', title: 'Analyze Any Site',
        img: '/lander/12.png',
        copy: 'Drop in a site. AI reads the landscape and outputs annotated sections: plants, drainage, soil layers.',
    },
    {
        num: '03', title: 'Iterate Facades at Speed',
        img: '/lander/23.png',
        copy: 'One base structure. Infinite directions. AI tests every variation before you commit to one.',
    },
    {
        num: '04', title: 'Sketch to Photorealistic Render',
        img: '/lander/2.png',
        copy: 'Draw the idea rough. AI builds the world. Fully rendered, client ready, in minutes.',
    },
    {
        num: '05', title: 'Section & Interior Visualization',
        img: '/lander/13.png',
        copy: 'AI cuts through any building and renders the spatial experience inside. No modeling software needed.',
    },
]

const STUDIOS = [
    'FORM Studio', 'Atelier Haus', 'Studio Collective', 'Arc & Co.',
    'Design Meridian', 'Whitespace Lab', 'Grid Atelier', 'The Spatial Co.',
    'Studio Mira', 'Blank Canvas', 'Forma Group', 'Norte Studio',
    'Eleven Architecture', 'Archway', 'Blueprint Studio', 'Render+',
]


const SPRINT_FEATURES = [
    'Day 1: Foundation. Identify AI stack, run first prompt to render workflow',
    'Day 2: In Depth. Master prompting from mediocre to advanced',
    'Day 3: Full Circle. Package results for client presentation',
    'Leave with portfolio renders. Generate in 20 min, not 3 weeks',
]

const WORKSHOPS = [
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

const MASTERCLASS_VIDEOS = [
    { num: 1, id: '1113394028', label: 'Masterclass Cohort 1' },
    { num: 2, id: '1113394271', label: 'Masterclass Cohort 2' },
    { num: 3, id: '1113394139', label: 'Masterclass Cohort 3' },
]

const VSL_VIDEO_ID = '1174567061'
// Replace with actual testimonial mashup Vimeo ID when available
const TESTIMONIAL_MASHUP_ID = '1113394028'

const CASE_STUDIES: CaseStudy[] = [
    {
        id: 'nisreen',
        name: 'Nisreen Kayyali',
        projectType: 'Commercial Architecture',
        location: 'Riyadh, Saudi Arabia',
        tagline: 'An empty desert plot, a brief, and AI. This is what came out the other side.',
        previewImgs: [
            '/casestudies/nisreen/money-shot-light.jpg',
            '/casestudies/nisreen/progression-3.jpg',
            '/casestudies/nisreen/interiors-0.jpg',
            '/casestudies/nisreen/details-0.jpg',
        ],
        slides: [
            // ── Progression ──────────────────────────────────────────
            { img: '/casestudies/nisreen/progression-1.jpg', stepLabel: '01', category: 'The Site', title: 'The Empty Plot', caption: 'An unmarked piece of desert near King Salman Metro Station, Riyadh. No building. No concept. Just land and a brief.' },
            { img: '/casestudies/nisreen/progression-2.jpg', stepLabel: '02', category: 'The Site', title: 'Standing on the Land', caption: 'Nisreen visits the actual site. This is the raw material the AI has to work with. A construction zone, desert heat, and a vision.' },
            { img: '/casestudies/nisreen/progression-4.jpg', stepLabel: '03', category: 'The Design', title: 'Form Mapped Onto Reality', caption: 'The building footprint is drawn directly onto the site photo. AI helps define the organic massing against the real land before any software is opened.' },
            { img: '/casestudies/nisreen/progression-3.jpg', stepLabel: '04', category: 'The Design', title: 'First AI Render', caption: 'The building materializes. Organic arched canopy, terracotta facade, rooftop gardens, street life. Generated from a prompt in a single session.' },
            { img: '/casestudies/nisreen/progression-5.jpg', stepLabel: '05', category: 'The Design', title: 'Site in Context', caption: 'Aerial view confirming the design responds to its surroundings. King Salman Park next door. The AI-directed massing reads perfectly at urban scale.' },
            // ── Hero Renders ─────────────────────────────────────────
            { img: '/casestudies/nisreen/money-shot-light.jpg', stepLabel: '06', category: 'Hero Renders', title: 'The Entrance — Day', caption: 'The money shot. Photorealistic daylight render of the arched entrance canopy, rooftop palms, and cobblestone approach. Client-ready.' },
            { img: '/casestudies/nisreen/money-shot-night.jpg', stepLabel: '07', category: 'Hero Renders', title: 'The Entrance — Night', caption: 'Same view after dark. Warm lighting, deep shadows, cinematic mood. Two completely different atmospheres from the same AI workflow.' },
            // ── Interiors ────────────────────────────────────────────
            { img: '/casestudies/nisreen/interiors-0.jpg', stepLabel: '08', category: 'Interiors', title: 'Interior 01', caption: 'AI-generated interior perspective. Material choices, lighting logic, and spatial proportion — all directed through prompts.' },
            { img: '/casestudies/nisreen/interiors-1.jpg', stepLabel: '09', category: 'Interiors', title: 'Interior 02', caption: 'Variation generated in minutes. The same space explored from a different angle and atmosphere.' },
            { img: '/casestudies/nisreen/interiors-2.jpg', stepLabel: '10', category: 'Interiors', title: 'Interior 03', caption: '' },
            { img: '/casestudies/nisreen/interiors-3.jpg', stepLabel: '11', category: 'Interiors', title: 'Interior 04', caption: '' },
            { img: '/casestudies/nisreen/interiors-4.jpg', stepLabel: '12', category: 'Interiors', title: 'Interior 05', caption: '' },
            { img: '/casestudies/nisreen/interiors-5.jpg', stepLabel: '13', category: 'Interiors', title: 'Interior 06', caption: '' },
            // ── Details ──────────────────────────────────────────────
            { img: '/casestudies/nisreen/details-0.jpg', stepLabel: '14', category: 'Details', title: 'Detail 01', caption: 'AI close-up of key architectural detail. Texture, material, and precision that would take weeks to produce traditionally.' },
            { img: '/casestudies/nisreen/details-1.jpg', stepLabel: '15', category: 'Details', title: 'Detail 02', caption: '' },
            { img: '/casestudies/nisreen/details-2.jpg', stepLabel: '16', category: 'Details', title: 'Detail 03', caption: '' },
            { img: '/casestudies/nisreen/details-3.jpg', stepLabel: '17', category: 'Details', title: 'Detail 04', caption: '' },
            { img: '/casestudies/nisreen/details-4.jpg', stepLabel: '18', category: 'Details', title: 'Detail 05', caption: '' },
            { img: '/casestudies/nisreen/details-5.jpg', stepLabel: '19', category: 'Details', title: 'Detail 06', caption: '' },
            { img: '/casestudies/nisreen/details-6.jpg', stepLabel: '20', category: 'Details', title: 'Detail 07', caption: '' },
            { img: '/casestudies/nisreen/details-7.jpg', stepLabel: '21', category: 'Details', title: 'Detail 08', caption: '' },
            // ── Side Views ───────────────────────────────────────────
            { img: '/casestudies/nisreen/villa-side-0.jpg', stepLabel: '22', category: 'Side Views', title: 'Side Elevation 01', caption: 'AI-generated side elevation render. The full depth of the project revealed — every angle explored.' },
            { img: '/casestudies/nisreen/villa-side-1.jpg', stepLabel: '23', category: 'Side Views', title: 'Side Elevation 02', caption: '' },
            // ── Wayfinding ───────────────────────────────────────────
            { img: '/casestudies/nisreen/wayfinding-0.jpg', stepLabel: '24', category: 'Wayfinding', title: 'Signage 01', caption: 'AI-generated wayfinding and signage concepts. Brand-consistent, architecturally integrated.' },
            { img: '/casestudies/nisreen/wayfinding-1.jpg', stepLabel: '25', category: 'Wayfinding', title: 'Signage 02', caption: '' },
            // ── Parking ──────────────────────────────────────────────
            { img: '/casestudies/nisreen/parking-0.jpg', stepLabel: '26', category: 'Parking', title: 'Parking Level', caption: 'Even utility spaces get the full AI treatment. Underground parking visualization for client presentation.' },
        ],
    },
    {
        id: 'aleena',
        name: 'Aleena Al Waqas',
        projectType: 'Hospitality Interior Design',
        location: 'UAE',
        tagline: 'A complete luxury F&B interior — every perspective generated with AI. Backed by a full video walkthrough.',
        previewImgs: [
            '/casestudies/aleena/full-shot.jpg',
            '/casestudies/aleena/shot-1.jpg',
            '/casestudies/aleena/shot-4.jpg',
            '/casestudies/aleena/shot-7.jpg',
        ],
        slides: [
            { vimeoId: '1185031477', stepLabel: '▶', category: 'Walkthrough', title: 'Full Video Walkthrough', caption: 'A complete AI-directed video walkthrough of the luxury F&B interior. Every surface, angle, and atmosphere — generated.' },
            { img: '/casestudies/aleena/full-shot.jpg',  stepLabel: '01', category: 'Overview',      title: 'The Hero Shot',    caption: 'A luxury F&B interior. Warm stone arches, onyx bar counter, soaring ceilings, palm-framed windows. Client-ready on day one.' },
            { img: '/casestudies/aleena/shot-1.jpg',     stepLabel: '02', category: 'Perspectives',  title: 'Shot 02',          caption: 'AI-generated perspective exploring the spatial sequence from entry to bar.' },
            { img: '/casestudies/aleena/shot-2.jpg',     stepLabel: '03', category: 'Perspectives',  title: 'Shot 03',          caption: '' },
            { img: '/casestudies/aleena/shot-3.jpg',     stepLabel: '04', category: 'Perspectives',  title: 'Shot 04',          caption: '' },
            { img: '/casestudies/aleena/shot-4.jpg',     stepLabel: '05', category: 'Perspectives',  title: 'Shot 05',          caption: '' },
            { img: '/casestudies/aleena/shot-5.jpg',     stepLabel: '06', category: 'Perspectives',  title: 'Shot 06',          caption: '' },
            { img: '/casestudies/aleena/shot-6.jpg',     stepLabel: '07', category: 'Perspectives',  title: 'Shot 07',          caption: '' },
            { img: '/casestudies/aleena/shot-7.jpg',     stepLabel: '08', category: 'Perspectives',  title: 'Shot 08',          caption: '' },
            { img: '/casestudies/aleena/shot-9.jpg',     stepLabel: '09', category: 'Perspectives',  title: 'Shot 09',          caption: '' },
            { img: '/casestudies/aleena/shot-10.jpg',    stepLabel: '10', category: 'Perspectives',  title: 'Shot 10',          caption: 'Every angle of the space explored. All generated — no photography, no 3D modeling software.' },
        ],
    },
    {
        id: 'akshay',
        name: 'b.form',
        projectType: 'Product & Furniture Brand',
        location: 'India',
        tagline: 'Raw studio product shots fed into AI. What came out the other side is a fully visualized furniture brand.',
        previewImgs: [
            '/casestudies/akshay/after-1.jpg',
            '/casestudies/akshay/after-3.jpg',
            '/casestudies/akshay/after-8.jpg',
            '/casestudies/akshay/before-2.jpg',
        ],
        slides: [
            { vimeoId: '1185031432', stepLabel: '▶', category: 'Walkthrough', title: 'Midjourney to Final — Full Walkthrough', caption: 'The complete journey: from raw Midjourney explorations to client-ready b.form product renders.' },
            // ── Before ────────────────────────────────────────────
            { img: '/casestudies/akshay/before-1.jpg',  stepLabel: '01', category: 'Before — Raw Inputs', title: 'Studio Shot 01',  caption: 'The starting point. Raw product photography and early Midjourney explorations — the material AI is directed from.' },
            { img: '/casestudies/akshay/before-2.jpg',  stepLabel: '02', category: 'Before — Raw Inputs', title: 'Studio Shot 02',  caption: '' },
            { img: '/casestudies/akshay/before-3.jpg',  stepLabel: '03', category: 'Before — Raw Inputs', title: 'Studio Shot 03',  caption: '' },
            { img: '/casestudies/akshay/before-4.jpg',  stepLabel: '04', category: 'Before — Raw Inputs', title: 'Studio Shot 04',  caption: '' },
            { img: '/casestudies/akshay/before-5.jpg',  stepLabel: '05', category: 'Before — Raw Inputs', title: 'Studio Shot 05',  caption: '' },
            { img: '/casestudies/akshay/before-6.jpg',  stepLabel: '06', category: 'Before — Raw Inputs', title: 'Studio Shot 06',  caption: '' },
            { img: '/casestudies/akshay/before-7.jpg',  stepLabel: '07', category: 'Before — Raw Inputs', title: 'Studio Shot 07',  caption: '' },
            { img: '/casestudies/akshay/before-8.jpg',  stepLabel: '08', category: 'Before — Raw Inputs', title: 'Studio Shot 08',  caption: '' },
            { img: '/casestudies/akshay/before-9.jpg',  stepLabel: '09', category: 'Before — Raw Inputs', title: 'Studio Shot 09',  caption: '' },
            { img: '/casestudies/akshay/before-10.jpg', stepLabel: '10', category: 'Before — Raw Inputs', title: 'Studio Shot 10',  caption: '' },
            { img: '/casestudies/akshay/before-11.jpg', stepLabel: '11', category: 'Before — Raw Inputs', title: 'Studio Shot 11',  caption: '' },
            { img: '/casestudies/akshay/before-12.jpg', stepLabel: '12', category: 'Before — Raw Inputs', title: 'Studio Shot 12',  caption: '' },
            { img: '/casestudies/akshay/before-13.jpg', stepLabel: '13', category: 'Before — Raw Inputs', title: 'Studio Shot 13',  caption: '' },
            { img: '/casestudies/akshay/before-14.jpg', stepLabel: '14', category: 'Before — Raw Inputs', title: 'Studio Shot 14',  caption: '' },
            { img: '/casestudies/akshay/before-15.jpg', stepLabel: '15', category: 'Before — Raw Inputs', title: 'Studio Shot 15',  caption: '' },
            { img: '/casestudies/akshay/before-16.jpg', stepLabel: '16', category: 'Before — Raw Inputs', title: 'Studio Shot 16',  caption: '' },
            { img: '/casestudies/akshay/before-17.jpg', stepLabel: '17', category: 'Before — Raw Inputs', title: 'Studio Shot 17',  caption: '' },
            { img: '/casestudies/akshay/before-18.jpg', stepLabel: '18', category: 'Before — Raw Inputs', title: 'Studio Shot 18',  caption: 'Every piece documented. This is the raw material — before AI touched it.' },
            // ── After ─────────────────────────────────────────────
            { img: '/casestudies/akshay/after-1.jpg',   stepLabel: '19', category: 'After — b.form Renders',  title: 'b.form Render 01', caption: 'AI transforms the raw input into a full photorealistic product render. Same object. Entirely different world.' },
            { img: '/casestudies/akshay/after-2.jpg',   stepLabel: '20', category: 'After — b.form Renders',  title: 'b.form Render 02', caption: '' },
            { img: '/casestudies/akshay/after-3.jpg',   stepLabel: '21', category: 'After — b.form Renders',  title: 'b.form Render 03', caption: '' },
            { img: '/casestudies/akshay/after-4.jpg',   stepLabel: '22', category: 'After — b.form Renders',  title: 'b.form Render 04', caption: '' },
            { img: '/casestudies/akshay/after-5.jpg',   stepLabel: '23', category: 'After — b.form Renders',  title: 'b.form Render 05', caption: '' },
            { img: '/casestudies/akshay/after-6.jpg',   stepLabel: '24', category: 'After — b.form Renders',  title: 'b.form Render 06', caption: '' },
            { img: '/casestudies/akshay/after-7.jpg',   stepLabel: '25', category: 'After — b.form Renders',  title: 'b.form Render 07', caption: '' },
            { img: '/casestudies/akshay/after-8.jpg',   stepLabel: '26', category: 'After — b.form Renders',  title: 'b.form Render 08', caption: '' },
            { img: '/casestudies/akshay/after-9.jpg',   stepLabel: '27', category: 'After — b.form Renders',  title: 'b.form Render 09', caption: '' },
            { img: '/casestudies/akshay/after-10.jpg',  stepLabel: '28', category: 'After — b.form Renders',  title: 'b.form Render 10', caption: '' },
            { img: '/casestudies/akshay/after-11.jpg',  stepLabel: '29', category: 'After — b.form Renders',  title: 'b.form Render 11', caption: '' },
            { img: '/casestudies/akshay/after-12.jpg',  stepLabel: '30', category: 'After — b.form Renders',  title: 'b.form Render 12', caption: '' },
            { img: '/casestudies/akshay/after-13.jpg',  stepLabel: '31', category: 'After — b.form Renders',  title: 'b.form Render 13', caption: '' },
            { img: '/casestudies/akshay/after-14.jpg',  stepLabel: '32', category: 'After — b.form Renders',  title: 'b.form Render 14', caption: 'The full library. Client-ready product imagery — generated entirely with AI.' },
        ],
    },
    {
        id: 'evan',
        name: 'Evan',
        projectType: 'Hospitality & Restaurant Design',
        location: 'UAE',
        tagline: 'A full restaurant concept brought to life — every space, every moment, AI-generated.',
        previewImgs: [
            '/casestudies/evan/entrance.jpg',
            '/casestudies/evan/dining.jpg',
            '/casestudies/evan/bartender.jpg',
            '/casestudies/evan/chandelier.jpg',
        ],
        slides: [
            { img: '/casestudies/evan/entrance.jpg',  stepLabel: '01', category: 'Arrival',    title: 'Restaurant Entrance',       caption: 'The first impression. AI-generated arrival sequence — lighting, materiality, and spatial welcome.' },
            { img: '/casestudies/evan/dining.jpg',    stepLabel: '02', category: 'Experience', title: 'Dining Atmosphere',         caption: 'A couple at table. AI generates the full spatial experience — from chair scale to ambient light.' },
            { img: '/casestudies/evan/interior.jpg',  stepLabel: '03', category: 'Experience', title: 'Interior Overview',         caption: 'Full interior perspective. Every surface, volume, and lighting condition directed by AI prompts.' },
            { img: '/casestudies/evan/bartender.jpg', stepLabel: '04', category: 'Details',    title: 'Bartender — Martini Pour',  caption: 'A cinematic moment. AI imagines the staff, the gesture, the glass — all in one render.' },
            { img: '/casestudies/evan/chandelier.jpg',stepLabel: '05', category: 'Details',    title: 'Chandelier Detail',         caption: 'Macro architectural detail. AI produces close-up material studies at photographic quality.' },
            { img: '/casestudies/evan/bar-macro.jpg', stepLabel: '06', category: 'Details',    title: 'Bar — Statement Ceiling',   caption: 'The bar counter and ceiling composition. AI-directed material palette and lighting.' },
            { img: '/casestudies/evan/food.jpg',      stepLabel: '07', category: 'Details',    title: 'Food Photography',          caption: 'Even the F&B photography is AI-generated. Full table composition, styled for client presentation.' },
            { img: '/casestudies/evan/grilling.jpg',  stepLabel: '08', category: 'Details',    title: 'Grilling Station',          caption: 'Back-of-house visualized. The chef, the fire, the station — AI-directed hospitality storytelling.' },
        ],
    },
    {
        id: 'ghaith',
        name: 'Ghaith',
        projectType: 'Interior & Product Design',
        location: 'UAE',
        tagline: 'High-end furniture and interior AI renders — production-quality output from prompts alone.',
        previewImgs: [
            '/casestudies/ghaith/shot-4.jpg',
            '/casestudies/ghaith/shot-1.jpg',
            '/casestudies/ghaith/shot-7.jpg',
            '/casestudies/ghaith/shot-9.jpg',
        ],
        slides: [
            { img: '/casestudies/ghaith/shot-1.jpg',  stepLabel: '01', category: 'Renders', title: 'Render 01', caption: 'AI-generated interior and product visualization. Every detail prompted and refined.' },
            { img: '/casestudies/ghaith/shot-2.jpg',  stepLabel: '02', category: 'Renders', title: 'Render 02', caption: '' },
            { img: '/casestudies/ghaith/shot-3.jpg',  stepLabel: '03', category: 'Renders', title: 'Render 03', caption: '' },
            { img: '/casestudies/ghaith/shot-4.jpg',  stepLabel: '04', category: 'Renders', title: 'High-End Armchair', caption: 'Photorealistic armchair product render. Material accuracy, lighting, and shadow — all AI-directed.' },
            { img: '/casestudies/ghaith/shot-5.jpg',  stepLabel: '05', category: 'Renders', title: 'Render 05', caption: '' },
            { img: '/casestudies/ghaith/shot-6.jpg',  stepLabel: '06', category: 'Renders', title: 'Render 06', caption: '' },
            { img: '/casestudies/ghaith/shot-7.jpg',  stepLabel: '07', category: 'Renders', title: 'Render 07', caption: '' },
            { img: '/casestudies/ghaith/shot-8.jpg',  stepLabel: '08', category: 'Renders', title: 'Render 08', caption: '' },
            { img: '/casestudies/ghaith/shot-9.jpg',  stepLabel: '09', category: 'Renders', title: 'Render 09', caption: 'The full output library. Every image client-ready. No photography, no 3D software.' },
        ],
    },
    {
        id: 'sultan',
        name: 'Sultan',
        projectType: 'Architectural Design',
        location: 'UAE',
        tagline: 'Photorealistic architectural renders — an entire project visualized with AI from the first prompt.',
        previewImgs: [
            '/casestudies/sultan/shot-3.jpg',
            '/casestudies/sultan/shot-1.jpg',
            '/casestudies/sultan/shot-5.jpg',
            '/casestudies/sultan/shot-7.jpg',
        ],
        slides: [
            { img: '/casestudies/sultan/shot-1.jpg',  stepLabel: '01', category: 'Renders', title: 'Render 01', caption: 'AI-generated architectural render. Full photorealistic output from a design brief.' },
            { img: '/casestudies/sultan/shot-2.jpg',  stepLabel: '02', category: 'Renders', title: 'Render 02', caption: '' },
            { img: '/casestudies/sultan/shot-3.jpg',  stepLabel: '03', category: 'Renders', title: 'Render 03', caption: '' },
            { img: '/casestudies/sultan/shot-4.jpg',  stepLabel: '04', category: 'Renders', title: 'Render 04', caption: '' },
            { img: '/casestudies/sultan/shot-5.jpg',  stepLabel: '05', category: 'Renders', title: 'Render 05', caption: '' },
            { img: '/casestudies/sultan/shot-6.jpg',  stepLabel: '06', category: 'Renders', title: 'Render 06', caption: '' },
            { img: '/casestudies/sultan/shot-7.jpg',  stepLabel: '07', category: 'Renders', title: 'Render 07', caption: '' },
            { img: '/casestudies/sultan/shot-8.jpg',  stepLabel: '08', category: 'Renders', title: 'Render 08', caption: 'Every angle explored. The complete project visualized before a single wall was built.' },
        ],
    },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function FadeIn({ children, direction = 'up', delay = 0, className = '' }: {
    children: React.ReactNode; direction?: 'up' | 'down' | 'left' | 'right'; delay?: number; className?: string
}) {
    const ref = useRef(null)
    const inView = useInView(ref, { once: true, margin: '-80px' })
    const off = { up: [0, 40], down: [0, -40], left: [40, 0], right: [-40, 0] }[direction]
    return (
        <motion.div ref={ref}
            initial={{ opacity: 0, x: off[0], y: off[1] }}
            animate={inView ? { opacity: 1, x: 0, y: 0 } : {}}
            transition={{ duration: 0.7, delay, ease: [0.25, 0.1, 0.25, 1] }}
            className={className}
        >{children}</motion.div>
    )
}

function SplitText({ text, className = '', baseDelay = 0 }: { text: string; className?: string; baseDelay?: number }) {
    const ref = useRef(null)
    const inView = useInView(ref, { once: true, margin: '-80px' })
    const words = text.split(' ')
    return (
        <span ref={ref} className={className}>
            {words.map((w, i) => (
                <motion.span key={i} className="inline-block"
                    initial={{ opacity: 0, y: 24 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.55, delay: baseDelay + i * 0.08, ease: [0.25, 0.1, 0.25, 1] }}
                >{w}{i < words.length - 1 ? '\u00A0' : ''}</motion.span>
            ))}
        </span>
    )
}

function GrainOverlay() {
    return (
        <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.03]">
            <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" /></filter>
                <rect width="100%" height="100%" filter="url(#grain)" />
            </svg>
        </div>
    )
}

function MicroLabel({ children, center = false }: { children: React.ReactNode; center?: boolean }) {
    return <p className={`text-[0.6875rem] font-body uppercase tracking-[0.2em] text-gray-500 ${center ? 'text-center' : ''}`}>{children}</p>
}

function LimeBar({ width = '4rem' }: { width?: string }) {
    return (
        <motion.div initial={{ width: 0 }} whileInView={{ width }} viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            className="bg-lime h-[2px] flex-shrink-0" style={{ width }} />
    )
}

// ── Lightbox ─────────────────────────────────────────────────────────────────

function Lightbox({ images, index, onClose }: {
    images: typeof GALLERY_ITEMS; index: number; onClose: () => void
}) {
    const [current, setCurrent] = useState(index)
    const [zoom, setZoom] = useState(1)

    const item = images[current]

    const prev = () => { setZoom(1); setCurrent((c) => (c - 1 + images.length) % images.length) }
    const next = () => { setZoom(1); setCurrent((c) => (c + 1) % images.length) }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex flex-col"
            onClick={onClose}
        >
            {/* Top bar */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] shrink-0" onClick={(e) => e.stopPropagation()}>
                <span className="text-xs uppercase tracking-widest text-gray-500">{item.label} · {current + 1}/{images.length}</span>
                <div className="flex items-center gap-2">
                    <button onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
                        className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition">
                        <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="text-xs text-gray-500 w-10 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
                    <button onClick={() => setZoom(z => Math.min(3, z + 0.25))}
                        className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition">
                        <ZoomIn className="w-4 h-4" />
                    </button>
                    <div className="w-px h-4 bg-white/10 mx-1" />
                    <button onClick={onClose}
                        className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Image area */}
            <div className="flex-1 flex items-center justify-center overflow-hidden cursor-default relative" onClick={(e) => e.stopPropagation()}>
                <motion.img
                    key={current}
                    src={item.img}
                    alt={item.label}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: zoom }}
                    transition={{ duration: 0.25 }}
                    className="max-h-full max-w-full object-contain select-none"
                    style={{ cursor: zoom > 1 ? 'grab' : 'default' }}
                    draggable={false}
                />
                {/* Prev / Next */}
                <button onClick={prev}
                    className="absolute left-4 p-3 rounded-full bg-black/60 border border-white/10 hover:border-white/30 text-white transition">
                    <ArrowRight className="w-5 h-5 rotate-180" />
                </button>
                <button onClick={next}
                    className="absolute right-4 p-3 rounded-full bg-black/60 border border-white/10 hover:border-white/30 text-white transition">
                    <ArrowRight className="w-5 h-5" />
                </button>
            </div>

            {/* Thumbnail strip */}
            <div className="flex gap-2 px-5 py-3 border-t border-white/[0.06] overflow-x-auto no-scrollbar shrink-0" onClick={(e) => e.stopPropagation()}>
                {images.map((img, i) => (
                    <button key={i} onClick={() => { setZoom(1); setCurrent(i) }}
                        className={`shrink-0 w-14 h-10 rounded-lg overflow-hidden border transition ${i === current ? 'border-lime/60' : 'border-white/10 opacity-50 hover:opacity-80'}`}>
                        <img src={img.img} alt={img.label} className="w-full h-full object-cover" />
                    </button>
                ))}
            </div>
        </motion.div>
    )
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface CaseStudySlide {
    img?: string        // absent on video slides
    vimeoId?: string    // present on video slides
    stepLabel: string
    category: string
    title: string
    caption: string
}

interface CaseStudy {
    id: string
    name: string
    projectType: string
    location: string
    tagline: string
    previewImgs: string[]
    slides: CaseStudySlide[]
}

// ─── Case Study Presentation ──────────────────────────────────────────────────

function CaseStudyPresentation({
    cs, slideIdx, onClose, onNext, onPrev, onJump,
}: {
    cs: CaseStudy
    slideIdx: number
    onClose: () => void
    onNext: () => void
    onPrev: () => void
    onJump: (i: number) => void
}) {
    const filmstripRef = useRef<HTMLDivElement>(null)
    const slide = cs.slides[slideIdx]

    useEffect(() => {
        const el = filmstripRef.current?.children[slideIdx] as HTMLElement
        el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }, [slideIdx])

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') onNext()
            if (e.key === 'ArrowLeft') onPrev()
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [onNext, onPrev, onClose])

    // Group slides by category for divider lines in filmstrip
    let lastCategory = ''

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[200] bg-black flex flex-col"
        >
            {/* ── Top bar: close + filmstrip ── */}
            <div className="flex items-center gap-3 px-3 sm:px-5 pt-2.5 pb-0 bg-black shrink-0">
                <button onClick={onClose}
                    className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full border border-white/10 hover:border-white/30 text-gray-400 hover:text-white transition">
                    <X className="w-4 h-4" />
                </button>

                {/* Filmstrip */}
                <div ref={filmstripRef} className="flex items-end gap-2 overflow-x-auto scrollbar-hide flex-1 py-1">
                    {cs.slides.map((s, i) => {
                        const isActive = i === slideIdx
                        const showDivider = s.category !== lastCategory && i > 0
                        const currentCategory = s.category
                        if (s.category !== lastCategory) lastCategory = s.category
                        return (
                            <div key={i} className="shrink-0 flex items-end gap-2">
                                {showDivider && (
                                    <div className="w-px h-10 bg-white/[0.08] shrink-0" />
                                )}
                                <button
                                    onClick={() => onJump(i)}
                                    className={`shrink-0 flex flex-col items-center gap-1 transition-all duration-200 ${isActive ? 'opacity-100' : 'opacity-30 hover:opacity-60'}`}
                                    title={`${currentCategory} — ${s.title}`}
                                >
                                    <div className={`w-14 h-9 rounded-lg overflow-hidden border-2 transition-colors duration-200 flex items-center justify-center bg-white/[0.04] ${isActive ? 'border-lime' : 'border-white/[0.06]'}`}>
                                        {s.vimeoId ? (
                                            <Play className="w-3.5 h-3.5 text-lime/80" />
                                        ) : (
                                            <img src={s.img} alt="" className="w-full h-full object-cover" loading="lazy" />
                                        )}
                                    </div>
                                    <span className={`text-[0.5rem] uppercase tracking-wider font-bold tabular-nums ${isActive ? 'text-lime' : 'text-gray-600'}`}>{s.stepLabel}</span>
                                </button>
                            </div>
                        )
                    })}
                </div>

                {/* Counter + project name */}
                <div className="shrink-0 text-right hidden sm:block">
                    <p className="text-[0.65rem] text-gray-600 tabular-nums">{slideIdx + 1} / {cs.slides.length}</p>
                    <p className="text-[0.6rem] uppercase tracking-[0.15em] text-gray-700">{cs.name}</p>
                </div>
            </div>

            {/* ── Slide info — below filmstrip ── */}
            <div className="px-4 sm:px-8 py-3 border-b border-white/[0.07] bg-black shrink-0">
                <div className="max-w-4xl mx-auto flex items-start justify-between gap-6">
                    <div className="flex-1 min-w-0">
                        <p className="text-[0.7rem] uppercase tracking-[0.22em] text-lime/80 font-bold mb-0.5">{slide.category}</p>
                        <p className="font-heading font-black uppercase text-lg sm:text-xl text-white leading-tight">{slide.title}</p>
                        {slide.caption && (
                            <p className="text-sm text-gray-400 mt-1 leading-relaxed line-clamp-2">{slide.caption}</p>
                        )}
                    </div>
                    <div className="shrink-0 text-right hidden sm:block">
                        <p className="text-[0.65rem] text-gray-600 tabular-nums">{slideIdx + 1} / {cs.slides.length}</p>
                    </div>
                </div>
            </div>

            {/* ── Main image / video ── */}
            <div className="flex-1 relative flex items-center justify-center overflow-hidden min-h-0 bg-[#060606] p-6 sm:p-10">
                <AnimatePresence mode="wait">
                    {slide.vimeoId ? (
                        <motion.div
                            key={`video-${slideIdx}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="w-full h-full flex items-center justify-center"
                        >
                            <div className="w-full max-w-4xl aspect-video rounded-2xl overflow-hidden shadow-2xl">
                                <iframe
                                    src={`https://player.vimeo.com/video/${slide.vimeoId}?autoplay=1&loop=0&title=0&byline=0&portrait=0&color=c8f542`}
                                    className="w-full h-full"
                                    allow="autoplay; fullscreen; picture-in-picture"
                                    allowFullScreen
                                    title={slide.title}
                                />
                            </div>
                        </motion.div>
                    ) : (
                        <motion.img
                            key={slideIdx}
                            src={slide.img}
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.18 }}
                            className="max-h-full max-w-full object-contain"
                            alt={slide.title}
                        />
                    )}
                </AnimatePresence>

                {/* Prev arrow */}
                <button onClick={onPrev}
                    className={`absolute left-3 sm:left-5 p-3 rounded-full bg-black/70 border border-white/10 hover:border-white/30 text-white transition backdrop-blur-sm ${slideIdx === 0 ? 'opacity-20 pointer-events-none' : ''}`}>
                    <ChevronLeft className="w-5 h-5" />
                </button>

                {/* Next arrow */}
                <button onClick={onNext}
                    className={`absolute right-3 sm:right-5 p-3 rounded-full bg-black/70 border border-white/10 hover:border-white/30 text-white transition backdrop-blur-sm ${slideIdx === cs.slides.length - 1 ? 'opacity-20 pointer-events-none' : ''}`}>
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>

        </motion.div>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function LandingPageTest() {
    const heroRef = useRef(null)
    const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
    const heroBgY = useTransform(scrollYProgress, [0, 1], ['0%', '25%'])
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
    const [activeMasterVideo, setActiveMasterVideo] = useState(0)
    const [tickerPage, setTickerPage] = useState(0)
    const [mobileTickerIdx, setMobileTickerIdx] = useState(0)
    const [caseStudyOpen, setCaseStudyOpen] = useState<string | null>(null)
    const [caseSlideIdx, setCaseSlideIdx] = useState(0)
    const TICKER_TOTAL = Math.ceil(WORKSHOPS.length / 3)
    useEffect(() => {
        const t = setInterval(() => {
            setTickerPage(p => (p + 1) % TICKER_TOTAL)
            setMobileTickerIdx(p => (p + 1) % WORKSHOPS.length)
        }, 5000)
        return () => clearInterval(t)
    }, [TICKER_TOTAL])

    return (
        <div className="min-h-screen bg-black text-white font-body overflow-x-hidden relative selection:bg-lime/30">
            <GrainOverlay />

            <style>{`
                @keyframes marquee { 0% { transform:translateX(0) } 100% { transform:translateX(-50%) } }
                .marquee-track { animation: marquee 30s linear infinite; }
                .announce-track { animation: marquee 22s linear infinite; }
                .no-scrollbar::-webkit-scrollbar { display:none; }
                .no-scrollbar { -ms-overflow-style:none; scrollbar-width:none; }
            `}</style>

            {/* Lightbox portal */}
            <AnimatePresence>
                {lightboxIndex !== null && (
                    <Lightbox
                        images={GALLERY_ITEMS}
                        index={lightboxIndex}
                        onClose={() => setLightboxIndex(null)}
                    />
                )}
            </AnimatePresence>

            {/* ── ANNOUNCEMENT BAR ───────────────────────────────────── */}
            <div className="fixed top-0 inset-x-0 z-[51] bg-lime overflow-hidden h-8 flex items-center">
                <div className="flex announce-track whitespace-nowrap">
                    {[...Array(6)].map((_, i) => (
                        <span key={i} className="inline-flex items-center gap-5 px-4 text-[0.6rem] font-black uppercase tracking-[0.2em] text-black">
                            <span className="w-1 h-1 rounded-full bg-black/30 shrink-0" />
                            Sprint Workshop · May 13 to 15
                            <span className="w-1 h-1 rounded-full bg-black/30 shrink-0" />
                            Limited Spots Remaining
                            <span className="w-1 h-1 rounded-full bg-black/30 shrink-0" />
                            Secure Your Place Now
                        </span>
                    ))}
                </div>
            </div>

            {/* ── NAV ────────────────────────────────────────────────── */}
            {/* PublicNav renders at top-0; offset to sit below the announcement bar */}
            <div className="[&>nav]:top-8">
                <PublicNav />
            </div>

            {/* ── HERO ───────────────────────────────────────────────── */}
            <section ref={heroRef} className="relative min-h-screen flex flex-col justify-center overflow-hidden">
                <motion.div style={{ y: heroBgY }} className="absolute inset-0 z-0">
                    <img src="/lander/1.png" alt="" className="absolute inset-0 w-full h-full object-cover object-center" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-black/30" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50" />
                </motion.div>

                <div className="relative z-10 container mx-auto px-5 sm:px-6 pt-36 pb-24 sm:pt-44 sm:pb-32">
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-10 lg:gap-16 items-center">
                        <div className="max-w-3xl">
                            <motion.div initial={{ width: 0 }} animate={{ width: '3rem' }}
                                transition={{ duration: 0.8 }} className="h-[3px] bg-lime mb-5" />

                            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-[0.6875rem] font-body uppercase tracking-[0.2em] text-gray-400 mb-5">
                                AI for Interior Designers, Architects, and Marketers.
                            </motion.p>

                            <h1 className="font-heading font-black uppercase leading-[0.92] text-[clamp(2.6rem,7vw,5.5rem)] mb-6">
                                <span className="block text-white whitespace-nowrap"><SplitText text="THIS IS WHAT" baseDelay={0.1} /></span>
                                <span className="block text-lime whitespace-nowrap"><SplitText text="AI DIRECTED" baseDelay={0.28} /></span>
                                <span className="block text-white whitespace-nowrap"><SplitText text="DESIGN LOOKS LIKE." baseDelay={0.52} /></span>
                            </h1>

                            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.95 }}
                                className="text-sm sm:text-base md:text-lg text-gray-300 max-w-xl mb-10 leading-relaxed">
                                <span className="text-gray-500 text-xs uppercase tracking-[0.18em]">Disclaimer:</span>{' '}
                                Every image on this page was generated by AI.
                            </motion.p>

                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1.1 }}
                                className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                                <a href="/find-your-path"
                                    className="px-9 py-4 gradient-lime text-black font-body font-bold uppercase tracking-wider rounded-full hover:opacity-90 transition-all duration-300 hover:-translate-y-1 flex items-center justify-center gap-2 text-sm shadow-[0_0_40px_rgba(208,255,113,0.25)]">
                                    See Where You're At With AI <ArrowRight className="w-4 h-4" />
                                </a>
                            </motion.div>

                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}
                                className="flex flex-wrap items-center gap-3 sm:gap-4 mt-10 text-[0.6rem] sm:text-[0.6875rem] text-gray-600 uppercase tracking-[0.15em]">
                                <span>500+ Surveyed</span>
                                <span className="w-1 h-1 rounded-full bg-gray-700" />
                                <span>15+ Studios</span>
                                <span className="w-1 h-1 rounded-full bg-gray-700" />
                                <span>Architects &amp; Designers</span>
                            </motion.div>
                        </div>

                        {/* 4:5 video — desktop only (placeholder until real clip provided) */}
                        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.7 }}
                            className="hidden lg:block pl-8 shrink-0">
                            <div className="w-48 xl:w-56 rounded-2xl overflow-hidden border border-white/10 bg-white/[0.03]"
                                style={{ aspectRatio: '4/5' }}>
                                <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-center px-4">
                                    <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center">
                                        <ArrowRight className="w-4 h-4 text-white/30 rotate-90" />
                                    </div>
                                    <p className="text-[0.6rem] uppercase tracking-[0.18em] text-white/20">Video placeholder</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>

                <div className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-black to-transparent pointer-events-none" />
            </section>

            {/* ── VSL ────────────────────────────────────────────────── */}
            <section className="py-20 md:py-28 border-t border-white/[0.04] bg-black">
                <div className="container mx-auto px-5 sm:px-6 max-w-4xl">
                    <FadeIn className="text-center mb-10">
                        <MicroLabel center>AI For Architects And Designers</MicroLabel>
                        <h2 className="font-heading font-black uppercase text-[clamp(1.9rem,5.5vw,4rem)] leading-[0.93] mt-4 mb-4">
                            AI <span className="text-lime">REDEFINES</span> DESIGN.
                        </h2>
                        <p className="text-gray-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
                            Watch a complete AI design workflow from brief to final render.
                        </p>
                    </FadeIn>
                    <FadeIn delay={0.2}>
                        <div className="rounded-2xl overflow-hidden border border-white/[0.08] bg-[#0a0a0a] aspect-video shadow-[0_0_80px_rgba(208,255,113,0.06)]">
                            <iframe
                                src={`https://player.vimeo.com/video/${VSL_VIDEO_ID}?autoplay=0&title=0&byline=0&portrait=0&color=d0ff71`}
                                className="w-full h-full"
                                allow="autoplay; fullscreen; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                    </FadeIn>
                </div>
            </section>

            {/* ── TESTIMONIALS ───────────────────────────────────────── */}
            <section className="py-20 md:py-28 border-t border-white/[0.04] bg-[#050505]">
                <div className="container mx-auto px-5 sm:px-6">

                    <FadeIn className="text-center mb-10 md:mb-14">
                        <MicroLabel center>Real People. Real Results.</MicroLabel>
                        <h2 className="font-heading font-black uppercase text-[clamp(1.8rem,5vw,3.5rem)] leading-[0.95] mt-4 mb-3">
                            HEAR FROM OUR <span className="text-lime">PARTICIPANTS.</span>
                        </h2>
                        <p className="text-gray-500 text-base mt-2">This could be you.</p>
                    </FadeIn>

                    {/* Testimonial mashup — 16:9 */}
                    <FadeIn delay={0.1} className="mb-12 max-w-4xl mx-auto">
                        <div className="rounded-2xl overflow-hidden border border-white/[0.08] bg-black aspect-video shadow-[0_0_60px_rgba(208,255,113,0.05)]">
                            <iframe
                                src={`https://player.vimeo.com/video/${TESTIMONIAL_MASHUP_ID}?autoplay=0&title=0&byline=0&portrait=0&color=d0ff71`}
                                className="w-full h-full"
                                allow="autoplay; fullscreen; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                    </FadeIn>

                    {/* Workshop ticker */}
                    <FadeIn delay={0.2}>
                        {/* Mobile: 1 at a time */}
                        <div className="sm:hidden">
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-[0.6875rem] uppercase tracking-[0.2em] text-gray-600">Sprint Workshop Testimonials</p>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setMobileTickerIdx(p => (p - 1 + WORKSHOPS.length) % WORKSHOPS.length)}
                                        className="p-2 rounded-full border border-white/10 hover:border-lime/30 hover:text-lime text-gray-500 transition">
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <span className="text-[0.6875rem] text-gray-600 tabular-nums">{mobileTickerIdx + 1} / {WORKSHOPS.length}</span>
                                    <button onClick={() => setMobileTickerIdx(p => (p + 1) % WORKSHOPS.length)}
                                        className="p-2 rounded-full border border-white/10 hover:border-lime/30 hover:text-lime text-gray-500 transition">
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <AnimatePresence mode="wait">
                                <motion.div key={mobileTickerIdx}
                                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                    className="rounded-2xl overflow-hidden border border-white/[0.06] bg-black aspect-video">
                                    <iframe
                                        src={`https://player.vimeo.com/video/${WORKSHOPS[mobileTickerIdx].id}?autoplay=0&title=0&byline=0&portrait=0&color=d0ff71`}
                                        className="w-full h-full"
                                        allow="autoplay; fullscreen; picture-in-picture"
                                        allowFullScreen
                                    />
                                </motion.div>
                            </AnimatePresence>
                            <div className="flex items-center justify-center gap-1.5 mt-4">
                                {WORKSHOPS.map((_, i) => (
                                    <button key={i} onClick={() => setMobileTickerIdx(i)}
                                        className={`rounded-full transition-all duration-300 ${i === mobileTickerIdx ? 'w-5 h-1.5 bg-lime' : 'w-1.5 h-1.5 bg-white/20 hover:bg-white/40'}`} />
                                ))}
                            </div>
                        </div>

                        {/* Desktop: 3 at a time */}
                        <div className="hidden sm:block">
                            <div className="flex items-center justify-between mb-5">
                                <p className="text-[0.6875rem] uppercase tracking-[0.2em] text-gray-600">Sprint Workshop Testimonials</p>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setTickerPage(p => (p - 1 + TICKER_TOTAL) % TICKER_TOTAL)}
                                        className="p-2 rounded-full border border-white/10 hover:border-lime/30 hover:text-lime text-gray-500 transition">
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <span className="text-[0.6875rem] text-gray-600 tabular-nums">{tickerPage + 1} / {TICKER_TOTAL}</span>
                                    <button onClick={() => setTickerPage(p => (p + 1) % TICKER_TOTAL)}
                                        className="p-2 rounded-full border border-white/10 hover:border-lime/30 hover:text-lime text-gray-500 transition">
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <AnimatePresence mode="wait">
                                    {WORKSHOPS.slice(tickerPage * 3, tickerPage * 3 + 3).map((w, i) => (
                                        <motion.div key={`${tickerPage}-${i}`}
                                            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="rounded-2xl overflow-hidden border border-white/[0.06] bg-black aspect-video hover:border-lime/20 transition-colors">
                                            <iframe
                                                src={`https://player.vimeo.com/video/${w.id}?autoplay=0&title=0&byline=0&portrait=0&color=d0ff71`}
                                                className="w-full h-full pointer-events-none"
                                                allow="autoplay; fullscreen; picture-in-picture"
                                                allowFullScreen
                                            />
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                            <div className="flex items-center justify-center gap-1.5 mt-5">
                                {Array.from({ length: TICKER_TOTAL }).map((_, i) => (
                                    <button key={i} onClick={() => setTickerPage(i)}
                                        className={`rounded-full transition-all duration-300 ${i === tickerPage ? 'w-5 h-1.5 bg-lime' : 'w-1.5 h-1.5 bg-white/20 hover:bg-white/40'}`} />
                                ))}
                            </div>
                        </div>
                    </FadeIn>
                </div>
            </section>

            {/* ── CASE STUDIES ───────────────────────────────────────── */}
            <section className="py-20 md:py-28 border-t border-white/[0.04] bg-black">
                <div className="container mx-auto px-5 sm:px-6">
                    <FadeIn className="mb-12 md:mb-16">
                        <MicroLabel>Project Case Studies From Our Participants</MicroLabel>
                        <div className="flex flex-wrap items-end gap-4 mt-4">
                            <h2 className="font-heading font-black uppercase text-[clamp(1.8rem,5vw,3.5rem)] leading-[0.95]">
                                REAL PROJECTS.<br /><span className="text-lime">REAL AI OUTPUT.</span>
                            </h2>
                            <LimeBar />
                        </div>
                        <p className="text-gray-500 text-sm mt-3 max-w-lg">
                            Every image below was generated by AI. Click any project to open the full presentation.
                        </p>
                    </FadeIn>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {CASE_STUDIES.map((cs) => (
                            <FadeIn key={cs.id}>
                                <motion.div
                                    whileHover={{ y: -4 }}
                                    onClick={() => { setCaseStudyOpen(cs.id); setCaseSlideIdx(0) }}
                                    className="bg-[#0a0a0a] border border-white/[0.06] hover:border-white/[0.14] rounded-2xl overflow-hidden cursor-pointer transition-colors duration-300 group"
                                >
                                    {/* Preview grid */}
                                    <div className="flex h-60 sm:h-72 gap-[3px]">
                                        {/* Big left image */}
                                        <div className="relative overflow-hidden flex-[2]">
                                            <img src={cs.previewImgs[0]} alt=""
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20" />
                                        </div>
                                        {/* 3 stacked right */}
                                        <div className="flex flex-col flex-1 gap-[3px]">
                                            {cs.previewImgs.slice(1, 4).map((img, i) => (
                                                <div key={i} className="relative overflow-hidden flex-1 min-h-0">
                                                    <img src={img} alt=""
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Info row */}
                                    <div className="px-5 sm:px-6 py-5 flex items-center justify-between gap-4">
                                        <div className="min-w-0">
                                            <p className="text-[0.6rem] uppercase tracking-[0.2em] text-gray-600 font-bold mb-1.5">
                                                {cs.projectType} · {cs.location}
                                            </p>
                                            <h3 className="font-heading font-black uppercase text-xl sm:text-2xl text-white leading-tight">{cs.name}</h3>
                                            <p className="text-xs text-gray-500 mt-2 leading-relaxed line-clamp-2 max-w-sm">{cs.tagline}</p>
                                        </div>
                                        <div className="shrink-0 flex items-center gap-3">
                                            <span className="text-[0.6rem] text-gray-600 uppercase tracking-wider hidden sm:block">{cs.slides.length} slides</span>
                                            <div className="w-9 h-9 rounded-full border border-white/10 group-hover:border-lime/40 group-hover:bg-lime/10 transition-all flex items-center justify-center shrink-0">
                                                <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-lime transition-colors" />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

{/* Data section removed — case studies carry the proof weight */}

            {/* ARCHIVED: THE PROCESS, GALLERY, FULL FILM, AI CAPABILITIES, SOCIAL PROOF */}
            {false && (<>
            {/* ── THE PROCESS ────────────────────────────────────────── */}
            <section className="py-20 md:py-28 border-t border-white/[0.04] bg-[#080808]">

                {/* Part 1 — Traditional workflow header */}
                <div className="container mx-auto px-5 sm:px-6 mb-10 md:mb-14">
                    <FadeIn>
                        <MicroLabel>The Traditional Process</MicroLabel>
                        <div className="flex flex-wrap items-center gap-4 mt-4">
                            <h2 className="font-heading font-black uppercase text-[clamp(1.8rem,5vw,3.5rem)] leading-[0.95]">
                                HOW IT USED TO WORK
                            </h2>
                            <LimeBar />
                        </div>
                        <p className="text-gray-500 text-sm mt-3 max-w-md">Three stages. Linear. Slow. Expensive to change course.</p>
                    </FadeIn>
                </div>

                {/* Part 1 — 3-step row with arrows */}
                <div className="container mx-auto px-5 sm:px-6">
                    {/* Desktop */}
                    <div className="hidden md:grid grid-cols-[1fr_52px_1fr_52px_1fr] items-start">
                        {TRADITIONAL_STEPS.map((step, pos) => (
                            <>
                                <FadeIn key={step.num} delay={pos * 0.1}>
                                    <motion.div whileHover={{ y: -4 }} className="group cursor-default">
                                        <div className="relative h-52 rounded-2xl overflow-hidden border border-white/[0.06] group-hover:border-white/20 transition-all duration-300">
                                            <img src={step.img} alt={step.label}
                                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                                            <div className="absolute bottom-3 left-3">
                                                <p className="text-[0.55rem] font-heading font-black uppercase tracking-[0.2em] text-white/50">Step {step.num}</p>
                                                <p className="text-xs font-heading font-black uppercase tracking-wide text-white">{step.label}</p>
                                            </div>
                                        </div>
                                        <p className="text-[0.68rem] text-gray-600 mt-2.5 leading-snug px-0.5">{step.caption}</p>
                                    </motion.div>
                                </FadeIn>
                                {pos < 2 && (
                                    <div key={`arr-${pos}`} className="flex items-center justify-center pt-[84px]">
                                        <svg viewBox="0 0 52 20" fill="none" className="w-full h-5">
                                            <line x1="0" y1="10" x2="36" y2="10" stroke="rgb(255 255 255 / 0.18)" strokeWidth="1.5" />
                                            <path d="M34 4l8 6-8 6" stroke="rgb(255 255 255 / 0.35)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                )}
                            </>
                        ))}
                    </div>

                    {/* Mobile — vertical */}
                    <div className="md:hidden space-y-4">
                        {TRADITIONAL_STEPS.map((step, i) => (
                            <div key={step.num} className="flex gap-4 items-start">
                                <div className="flex flex-col items-center shrink-0 pt-1">
                                    <div className="w-8 h-8 rounded-full border border-white/20 bg-white/5 flex items-center justify-center">
                                        <span className="text-[0.6rem] font-heading font-black text-white/60">{step.num}</span>
                                    </div>
                                    {i < TRADITIONAL_STEPS.length - 1 && (
                                        <div className="w-px flex-1 bg-gradient-to-b from-white/20 to-white/5 my-1.5 min-h-[24px]" />
                                    )}
                                </div>
                                <div className="flex-1 pb-2">
                                    <div className="relative h-40 rounded-xl overflow-hidden border border-white/[0.06] mb-2">
                                        <img src={step.img} alt={step.label} className="absolute inset-0 w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                    </div>
                                    <p className="text-[0.7rem] font-heading font-black uppercase tracking-wider text-white/80">{step.label}</p>
                                    <p className="text-[0.68rem] text-gray-500 mt-1 leading-snug">{step.caption}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Part 2 — HOW IS AI REDEFINING THIS? */}
                <FadeIn>
                    <div className="relative mt-20 mb-14 overflow-hidden">
                        <div className="absolute inset-0">
                            <img src="/lander/pres-8.png" alt="AI Process Diagram" className="w-full h-full object-cover opacity-[0.1]" />
                            <div className="absolute inset-0 bg-gradient-to-r from-[#080808] via-[#080808]/60 to-[#080808]" />
                            <div className="absolute inset-0 bg-gradient-to-b from-[#080808] via-transparent to-[#080808]" />
                        </div>
                        <div className="relative container mx-auto px-5 sm:px-6 py-16 md:py-20 text-center">
                            <MicroLabel>Skidmore Owings &amp; Merrill × Zkandar AI</MicroLabel>
                            <h2 className="font-heading font-black uppercase text-[clamp(2rem,6vw,4.5rem)] leading-[0.9] mt-5 mb-5">
                                HOW IS AI<br />
                                <span className="text-lime">REDEFINING THIS?</span>
                            </h2>
                            <p className="text-gray-500 text-sm max-w-sm mx-auto leading-relaxed">
                                We ran this process with one of the world's top architecture firms. The difference came down to one thing: how you prompt.
                            </p>
                        </div>
                    </div>
                </FadeIn>

                {/* Part 3 — Mediocre vs Advanced prompting */}
                <div className="container mx-auto px-5 sm:px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">

                        {/* Mediocre Prompting */}
                        <FadeIn delay={0}>
                            <div className="group rounded-2xl overflow-hidden border border-white/[0.06] hover:border-red-500/25 transition-all duration-300 bg-white/[0.02]">
                                <div className="relative aspect-[16/10] overflow-hidden">
                                    <img src="/lander/pres-19.png" alt="Mediocre Prompting result"
                                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                                </div>
                                <div className="p-5 border-t border-white/[0.05]">
                                    <div className="flex items-center gap-2 mb-2.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500/70" />
                                        <span className="text-[0.6rem] font-heading font-black uppercase tracking-[0.2em] text-red-400/80">Mediocre Prompting</span>
                                    </div>
                                    <p className="text-white/90 font-semibold text-sm leading-snug mb-1.5">Generic output. No context, no direction.</p>
                                    <p className="text-gray-600 text-xs leading-relaxed">What you get when you describe the project without understanding how to steer AI. Technically correct. Architecturally forgettable.</p>
                                </div>
                            </div>
                        </FadeIn>

                        {/* Advanced Prompting */}
                        <FadeIn delay={0.12}>
                            <div className="group rounded-2xl overflow-hidden border border-white/[0.06] hover:border-lime/25 transition-all duration-300 bg-white/[0.02]">
                                <div className="relative aspect-[16/10] overflow-hidden">
                                    <img src="/lander/pres-20.png" alt="Advanced Prompting result"
                                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                                </div>
                                <div className="p-5 border-t border-white/[0.05]">
                                    <div className="flex items-center gap-2 mb-2.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-lime/70" />
                                        <span className="text-[0.6rem] font-heading font-black uppercase tracking-[0.2em] text-lime/80">Advanced Prompting</span>
                                    </div>
                                    <p className="text-white/90 font-semibold text-sm leading-snug mb-1.5">Cinematic. Atmospheric. Client-ready.</p>
                                    <p className="text-gray-600 text-xs leading-relaxed">Same project. Same AI. Completely different result. This is what happens when you know the framework — and it's exactly what Zkandar AI teaches.</p>
                                </div>
                            </div>
                        </FadeIn>

                    </div>
                </div>

            </section>

            {/* ── GALLERY ────────────────────────────────────────────── */}
            <section className="py-20 md:py-28 border-t border-white/[0.04] bg-black">
                <div className="container mx-auto px-5 sm:px-6">
                    <FadeIn className="mb-4">
                        <MicroLabel>Output Gallery</MicroLabel>
                        <h2 className="font-heading font-black uppercase text-[clamp(1.8rem,5vw,3.5rem)] leading-[0.95] mt-4">
                            EVERY IMAGE WAS<br />
                            <span className="text-lime">GENERATED WITH AI.</span>
                        </h2>
                    </FadeIn>
                    <FadeIn delay={0.1} className="mb-10 md:mb-14">
                        <p className="text-gray-600 text-sm max-w-lg mt-3">
                            The colosseum doesn't exist. AI built it from a sketch. Click any image to preview.
                        </p>
                    </FadeIn>

                    {/* Desktop editorial grid — 4 cols, 4 rows, all 11 items visible */}
                    <div className="hidden sm:grid grid-cols-4 auto-rows-[200px] gap-3 md:gap-4">
                        {GALLERY_ITEMS.map((item, i) => (
                            <motion.div
                                key={i}
                                onClick={() => setLightboxIndex(i)}
                                whileHover={{ scale: 1.015 }}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-40px' }}
                                transition={{ delay: (i % 4) * 0.06, duration: 0.5 }}
                                className={`relative rounded-2xl border border-white/[0.05] hover:border-lime/25 overflow-hidden group cursor-pointer transition-colors duration-300 ${item.cls}`}
                            >
                                <img src={item.img} alt={item.label}
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300" />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 gap-2">
                                    <Eye className="w-5 h-5 text-white" />
                                    <span className="text-[0.65rem] uppercase tracking-[0.15em] text-gray-200">{item.label}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Mobile: 2-col, no spans */}
                    <div className="sm:hidden grid grid-cols-2 gap-3">
                        {GALLERY_ITEMS.map((item, i) => (
                            <motion.div
                                key={i}
                                onClick={() => setLightboxIndex(i)}
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.04 }}
                                className="relative h-36 rounded-xl border border-white/[0.05] overflow-hidden cursor-pointer"
                            >
                                <img src={item.img} alt={item.label} className="absolute inset-0 w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/20 hover:bg-black/50 transition-colors duration-300" />
                                <div className="absolute bottom-2 left-2.5 flex items-center gap-1">
                                    <Eye className="w-3 h-3 text-white/60" />
                                    <span className="text-[0.55rem] uppercase tracking-wider text-white/60">{item.label}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── FULL FILM ──────────────────────────────────────────── */}
            <section className="border-t border-white/[0.04] bg-black">
                {/* Cinematic header */}
                <div className="container mx-auto px-5 sm:px-6 pt-20 md:pt-28 pb-10 md:pb-14">
                    <FadeIn>
                        <MicroLabel>The Full Product</MicroLabel>
                        <div className="flex flex-wrap items-end justify-between gap-6 mt-4">
                            <div>
                                <h2 className="font-heading font-black uppercase text-[clamp(1.8rem,5vw,3.5rem)] leading-[0.95]">
                                    A FULLY AI-GENERATED<br />
                                    <span className="text-lime">FEATURE FILM.</span>
                                </h2>
                                <p className="text-gray-500 text-sm mt-4 max-w-xl leading-relaxed">
                                    Every frame. Every scene. Every visual. Produced entirely through AI directed workflows.
                                    No cameras. No crew. No traditional production.
                                    This is what you learn to build.
                                </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                <span className="text-[0.6875rem] uppercase tracking-[0.2em] text-gray-600">Full feature · AI-generated</span>
                            </div>
                        </div>
                    </FadeIn>
                </div>

                {/* Full-width video */}
                <FadeIn delay={0.15}>
                    <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                        <iframe
                            src="https://player.vimeo.com/video/1183148939?title=0&byline=0&portrait=0&badge=0&dnt=1"
                            className="absolute inset-0 w-full h-full"
                            frameBorder="0"
                            allow="autoplay; fullscreen; picture-in-picture"
                            allowFullScreen
                            title="Fully AI-Generated Feature Film — Zkandar AI"
                        />
                    </div>
                </FadeIn>

                {/* Caption strip */}
                <div className="container mx-auto px-5 sm:px-6 py-6 flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.04]">
                    <p className="text-xs text-gray-700 uppercase tracking-[0.15em]">
                        Produced using AI workflows taught in the Sprint Workshop &amp; Masterclass
                    </p>
                    <a href="/find-your-path"
                        className="inline-flex items-center gap-2 text-xs font-bold text-lime hover:text-lime/80 uppercase tracking-[0.15em] transition">
                        See where you're at with AI <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                </div>
            </section>

            {/* ── 5 AI CAPABILITIES ──────────────────────────────────── */}
            <section className="py-20 md:py-28 border-t border-white/[0.04] bg-[#080808]">
                <div className="container mx-auto px-5 sm:px-6">
                    <FadeIn className="mb-12 md:mb-16">
                        <MicroLabel>What AI Can Do</MicroLabel>
                        <h2 className="font-heading font-black uppercase text-[clamp(1.8rem,5vw,3.5rem)] leading-[0.95] mt-4">
                            5 THINGS AI MADE POSSIBLE<br />
                            <span className="text-lime">ON THIS PROJECT</span>
                        </h2>
                        <p className="text-gray-500 text-sm mt-3 max-w-lg">We teach each of these in the Sprint Workshop and Masterclass.</p>
                    </FadeIn>

                    {/* 2×2 grid + last card full-width */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
                        {CAPABILITIES.map((cap, i) => (
                            <FadeIn key={i} delay={i * 0.08}
                                className={i === 4 ? 'sm:col-span-2' : ''}>
                                <motion.div whileHover={{ y: -4 }}
                                    className={`relative bg-[#0d0d0d] border border-white/[0.06] hover:border-lime/25 rounded-2xl overflow-hidden group h-full transition-colors duration-300 ${i === 4 ? 'flex flex-col sm:flex-row' : 'flex flex-col'}`}>
                                    <div className={`relative overflow-hidden shrink-0 ${i === 4 ? 'h-48 sm:h-auto sm:w-72' : 'h-44 sm:h-48'}`}>
                                        <img src={cap.img} alt={cap.title}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-[#0d0d0d]/20 to-transparent" />
                                        <div className="absolute top-3 right-3">
                                            <span className="text-[0.625rem] font-heading font-black text-lime bg-black/70 backdrop-blur-sm border border-lime/20 px-2 py-1 rounded-lg tracking-wider">
                                                {cap.num}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-5 sm:p-6 flex flex-col justify-center">
                                        <h3 className="font-heading font-black uppercase text-sm sm:text-base mb-2">{cap.title}</h3>
                                        <p className="text-xs text-gray-500 leading-relaxed">{cap.copy}</p>
                                    </div>
                                </motion.div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── SOCIAL PROOF ───────────────────────────────────────── */}
            <section className="py-20 md:py-28 border-t border-white/[0.04] bg-black">
                <div className="container mx-auto px-5 sm:px-6">

                    <FadeIn className="mb-10 md:mb-12">
                        <MicroLabel>Studio Masterclasses</MicroLabel>
                        <div className="flex flex-wrap items-center gap-3 mt-4">
                            <h2 className="font-heading font-black uppercase text-[clamp(1.4rem,4vw,2.5rem)] leading-[0.95]">TRUSTED BY 15+ STUDIOS</h2>
                            <span className="px-3 py-1 rounded-full bg-lime/10 border border-lime/20 text-lime text-[0.6875rem] uppercase tracking-[0.15em] font-bold shrink-0">Growing</span>
                        </div>
                        <p className="text-gray-500 text-sm mt-3 max-w-lg">
                            5 Firm-Wide Master Classes Delivered. Every studio left with a certified AI workflow they own.
                        </p>
                    </FadeIn>

                    {/* Studios marquee */}
                    <FadeIn delay={0.05} className="mb-10">
                        <div className="overflow-hidden border-t border-b border-white/[0.04] py-3.5">
                            <div className="flex gap-8 marquee-track whitespace-nowrap">
                                {[...STUDIOS, ...STUDIOS].map((s, i) => (
                                    <span key={i} className="text-[0.6875rem] uppercase tracking-[0.2em] text-gray-600 inline-flex items-center gap-8">
                                        {s}<span className="text-lime/30">·</span>
                                    </span>
                                ))}
                            </div>
                        </div>
                    </FadeIn>

                    {/* Masterclass video player */}
                    <FadeIn delay={0.1}>
                        <div className="rounded-2xl overflow-hidden border border-white/[0.06] bg-black aspect-video mb-4">
                            <iframe
                                key={`master-${activeMasterVideo}`}
                                src={`https://player.vimeo.com/video/${MASTERCLASS_VIDEOS[activeMasterVideo].id}?autoplay=0&title=0&byline=0&portrait=0&color=d0ff71`}
                                className="w-full h-full"
                                allow="autoplay; fullscreen; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                    </FadeIn>

                    {/* Masterclass selector */}
                    <FadeIn delay={0.15}>
                        <div className="flex flex-wrap gap-2">
                            {MASTERCLASS_VIDEOS.map((w, i) => (
                                <button
                                    key={w.num}
                                    onClick={() => setActiveMasterVideo(i)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all duration-200 ${i === activeMasterVideo ? 'bg-lime/10 border-lime/40 text-lime' : 'border-white/[0.08] text-gray-500 hover:border-white/20 hover:text-gray-300'}`}
                                >
                                    {w.label}
                                </button>
                            ))}
                        </div>
                    </FadeIn>

                </div>
            </section>
            </>)}

            {/* ── SPRINT WORKSHOP — PRIMARY CTA ───────────────────────── */}
            <section id="sprint" className="py-20 md:py-32 border-t border-white/[0.04] bg-black">
                <div className="container mx-auto px-5 sm:px-6">
                    <FadeIn className="mb-12 md:mb-16 text-center">
                        <MicroLabel center>You've seen what's possible. Here's how to get there.</MicroLabel>
                        <h2 className="font-heading font-black uppercase text-[clamp(2rem,5vw,4rem)] leading-[0.93] mt-4">
                            THREE DAYS.<br /><span className="text-lime">EVERYTHING CHANGES.</span>
                        </h2>
                        <p className="text-gray-500 text-sm mt-5 max-w-sm mx-auto leading-relaxed">
                            The Sprint Workshop is where it starts. Hands-on, output-first, and open to architects and designers worldwide.
                        </p>
                    </FadeIn>

                    {/* Sprint card — full-width featured */}
                    <FadeIn className="max-w-2xl mx-auto">
                        <motion.div whileHover={{ y: -3 }}
                            className="relative rounded-3xl border border-lime/20 bg-gradient-to-b from-lime/[0.04] to-transparent overflow-hidden"
                            style={{ boxShadow: '0 0 80px -20px rgba(208,255,113,0.1)' }}
                        >
                            {/* Header image strip */}
                            <div className="relative h-40 overflow-hidden">
                                <img src="/casestudies/nisreen/money-shot-light.jpg" alt="" className="absolute inset-0 w-full h-full object-cover opacity-50" />
                                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black" />
                                <div className="absolute bottom-0 left-0 right-0 px-8 pb-5 flex items-end justify-between">
                                    <div>
                                        <p className="text-[0.6rem] font-black uppercase tracking-[0.2em] text-lime/80 mb-1">Sprint Workshop</p>
                                        <h3 className="font-heading font-black uppercase text-2xl sm:text-3xl text-white leading-none">Go From Zero<br />to AI-Fluent.</h3>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-lime/10 border border-lime/20">
                                        <div className="w-1.5 h-1.5 rounded-full bg-lime animate-pulse shrink-0" />
                                        <span className="text-[0.6rem] font-bold uppercase tracking-wider text-lime whitespace-nowrap">May 13–15 · Filling Fast</span>
                                    </div>
                                </div>
                            </div>

                            {/* Body */}
                            <div className="px-7 sm:px-10 pt-7 pb-8">
                                <p className="text-gray-400 text-sm leading-relaxed mb-7">
                                    3 days. Hands-on. You leave with real AI-generated deliverables and the skills to keep producing — for yourself and your clients.
                                </p>

                                {/* Features — two columns */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-8">
                                    {SPRINT_FEATURES.map(f => (
                                        <div key={f} className="flex items-center gap-3 text-sm text-gray-300">
                                            <div className="w-1.5 h-1.5 rounded-full bg-lime shrink-0" />{f}
                                        </div>
                                    ))}
                                </div>

                                {/* Stats strip */}
                                <div className="grid grid-cols-2 gap-3 mb-8 py-5 border-y border-white/[0.06]">
                                    {[{ val: '3 Days', label: 'Live & Hands-On' }, { val: '1000+', label: 'Participants' }].map(s => (
                                        <div key={s.label} className="text-center">
                                            <div className="text-xl font-heading font-black text-white">{s.val}</div>
                                            <div className="text-[0.6rem] uppercase tracking-wider text-gray-600 mt-0.5">{s.label}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* CTAs */}
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <a href="/find-your-path"
                                        className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-lime text-black font-body font-bold uppercase tracking-wider text-sm hover:opacity-90 transition">
                                        Find Your Path <ArrowRight className="w-4 h-4" />
                                    </a>
                                    <a href="/find-your-path"
                                        className="flex items-center justify-center gap-2 px-6 py-4 rounded-2xl border border-white/[0.08] text-gray-400 text-sm font-medium hover:border-white/20 hover:text-white transition">
                                        Find your path →
                                    </a>
                                </div>
                            </div>
                        </motion.div>
                    </FadeIn>
                </div>
            </section>

            {/* ── STUDIO / FIRM HOOK ───────────────────────────────────── */}
            <section className="border-t border-white/[0.04] bg-[#080808]">
                <div className="container mx-auto px-5 sm:px-6">
                    <div className="max-w-5xl mx-auto py-16 md:py-20 flex flex-col md:flex-row items-center md:items-stretch gap-10 md:gap-16">

                        {/* Left — editorial hook */}
                        <FadeIn direction="left" className="flex-1">
                            <p className="text-[0.6rem] font-black uppercase tracking-[0.22em] text-gray-600 mb-4">Not enrolling for yourself</p>
                            <h2 className="font-heading font-black uppercase text-[clamp(1.8rem,4vw,2.8rem)] leading-[0.93] text-white mb-5">
                                YOU'RE NOT<br />AN INDIVIDUAL.<br /><span className="text-lime">YOU'RE A FIRM.</span>
                            </h2>
                            <p className="text-gray-500 text-sm leading-relaxed max-w-sm">
                                Sending one designer to the Sprint is a start. But if you run a studio, an interior design firm, or a team of creatives — there's a program built specifically to transform the entire operation.
                            </p>
                            <div className="mt-6 flex items-start gap-3 p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                                <div className="w-8 h-8 rounded-full bg-lime/10 border border-lime/20 flex items-center justify-center shrink-0 mt-0.5">
                                    <Building2 className="w-4 h-4 text-lime" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-white mb-0.5">5 Firm-Wide Master Classes Delivered.</p>
                                    <p className="text-xs text-gray-500 leading-relaxed">Every studio left with a certified AI workflow they own permanently. Custom curriculum. Real output.</p>
                                </div>
                            </div>
                        </FadeIn>

                        {/* Right — studio logos + CTA */}
                        <FadeIn direction="right" className="flex-1 flex flex-col justify-between">
                            <div className="mb-6">
                                <p className="text-[0.6rem] uppercase tracking-[0.18em] text-gray-700 mb-3">Studios already in</p>
                                <div className="flex flex-wrap gap-2">
                                    {STUDIOS.map((s, i) => (
                                        <span key={i} className="text-[0.6rem] px-2.5 py-1 bg-white/[0.03] border border-white/[0.06] rounded-lg text-gray-500">{s}</span>
                                    ))}
                                </div>
                            </div>
                            <motion.a
                                href="/masterclass-analytics"
                                whileHover={{ x: 4 }}
                                className="group flex items-center justify-between gap-4 p-6 rounded-2xl border border-lime/15 bg-lime/[0.03] hover:border-lime/30 hover:bg-lime/[0.06] transition-all duration-300"
                            >
                                <div>
                                    <p className="text-[0.6rem] font-black uppercase tracking-[0.2em] text-lime/70 mb-1">AI Masterclass</p>
                                    <p className="font-heading font-black uppercase text-lg text-white leading-tight">See the Studio Program</p>
                                    <p className="text-xs text-gray-500 mt-1">Custom curriculum · Team-wide training · Firm certification</p>
                                </div>
                                <div className="w-10 h-10 rounded-full border border-lime/20 group-hover:border-lime/50 group-hover:bg-lime/10 flex items-center justify-center shrink-0 transition-all">
                                    <ArrowRight className="w-4 h-4 text-lime" />
                                </div>
                            </motion.a>
                        </FadeIn>
                    </div>
                </div>
            </section>

            {/* ── FOOTER ──────────────────────────────────────────────── */}
            <footer className="border-t border-white/[0.06] bg-black pt-14 pb-8">
                <div className="container mx-auto px-5 sm:px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-8 mb-12">

                        {/* Brand */}
                        <div className="col-span-2 md:col-span-1">
                            <a href="/test-landingpage" className="flex items-center gap-2.5 mb-4">
                                <img src={logoSrc} alt="Zkandar AI" className="h-7 object-contain" />
                            </a>
                            <p className="text-xs text-gray-600 leading-relaxed max-w-[180px]">
                                AI-directed design education for architects and designers.
                            </p>
                            <div className="flex items-center gap-3 mt-5">
                                <a href="https://www.instagram.com/zkandar" target="_blank" rel="noopener noreferrer"
                                    className="w-8 h-8 rounded-full border border-white/[0.08] flex items-center justify-center text-gray-500 hover:text-white hover:border-white/20 transition">
                                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                                </a>
                                <a href="https://www.linkedin.com/company/zkandar" target="_blank" rel="noopener noreferrer"
                                    className="w-8 h-8 rounded-full border border-white/[0.08] flex items-center justify-center text-gray-500 hover:text-white hover:border-white/20 transition">
                                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                                </a>
                            </div>
                        </div>

                        {/* Programs */}
                        <div>
                            <p className="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-gray-600 mb-4">Programs</p>
                            <ul className="space-y-3">
                                {[
                                    { label: 'Sprint Workshop', href: '/find-your-path' },
                                    { label: 'AI Masterclass', href: '/masterclass-analytics' },
                                    { label: 'Studio Discovery Call', href: 'https://calendly.com/zkandarstudio-info/ai-discovery-call' },
                                    { label: 'Enroll Now', href: '/checkout' },
                                ].map(l => (
                                    <li key={l.label}><a href={l.href} className="text-sm text-gray-500 hover:text-white transition">{l.label}</a></li>
                                ))}
                            </ul>
                        </div>

                        {/* Resources */}
                        <div>
                            <p className="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-gray-600 mb-4">Resources</p>
                            <ul className="space-y-3">
                                {[
                                    { label: 'Case Studies', href: '#case-studies' },
                                    { label: 'Find Your Path', href: '/find-your-path' },
                                    { label: 'Find Your Path', href: '/find-your-path' },
                                    { label: 'Participant Login', href: '/login' },
                                ].map(l => (
                                    <li key={l.label}><a href={l.href} className="text-sm text-gray-500 hover:text-white transition">{l.label}</a></li>
                                ))}
                            </ul>
                        </div>

                        {/* Contact */}
                        <div>
                            <p className="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-gray-600 mb-4">Contact</p>
                            <ul className="space-y-3">
                                {[
                                    { label: 'Book a Call', href: 'https://calendly.com/zkandar/sprint-questions' },
                                    { label: 'Privacy Policy', href: '/privacy' },
                                    { label: 'Terms of Service', href: '/terms' },
                                ].map(l => (
                                    <li key={l.label}><a href={l.href} className="text-sm text-gray-500 hover:text-white transition">{l.label}</a></li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Bottom bar */}
                    <div className="border-t border-white/[0.04] pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <p className="text-[0.6rem] text-gray-700 uppercase tracking-[0.15em]">
                            © {new Date().getFullYear()} Zkandar LLC. All rights reserved.
                        </p>
                        <p className="text-[0.6rem] text-gray-700 uppercase tracking-[0.12em]">
                            Dubai, United Arab Emirates
                        </p>
                    </div>
                </div>
            </footer>

            {/* ── CASE STUDY LIGHTBOX ────────────────────────────────── */}
            <AnimatePresence>
                {caseStudyOpen && (() => {
                    const cs = CASE_STUDIES.find(c => c.id === caseStudyOpen)!
                    const nextSlide = () => setCaseSlideIdx(i => Math.min(i + 1, cs.slides.length - 1))
                    const prevSlide = () => setCaseSlideIdx(i => Math.max(i - 1, 0))
                    return (
                        <CaseStudyPresentation
                            cs={cs}
                            slideIdx={caseSlideIdx}
                            onClose={() => setCaseStudyOpen(null)}
                            onNext={nextSlide}
                            onPrev={prevSlide}
                            onJump={setCaseSlideIdx}
                        />
                    )
                })()}
            </AnimatePresence>
        </div>
    )
}
