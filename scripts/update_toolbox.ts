import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://rhyofhpxmchfclrytwqf.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''; // Needs to be filled

async function run() {
    if (!supabaseKey) {
        console.error('Missing Supabase Key');
        process.exit(1);
    }
    const supabase = createClient(supabaseUrl, supabaseKey);
    // Delete existing
    await supabase.from('toolbox_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Insert new
    const { error } = await supabase.from('toolbox_items').insert([
        { title: 'Midjourney', description: 'Advanced AI image generation', category: 'Generation', tool_type: 'image_generation', url: 'https://midjourney.com', order_index: 1, importance: 'essential', is_active: true },
        { title: 'Higgsfield', description: 'Video generation and editing', category: 'Video', tool_type: 'video_generation', url: 'https://higgsfield.ai', order_index: 2, importance: 'essential', is_active: true },
        { title: 'Krea', description: 'Real-time image generation and enhancement', category: 'Generation', tool_type: 'image_generation', url: 'https://krea.ai', order_index: 3, importance: 'essential', is_active: true },
        { title: 'NanoBanana', description: 'AI design workflow platform', category: 'Workflow', tool_type: 'other', url: 'https://nanobanana.com', order_index: 4, importance: 'essential', is_active: true },
        { title: 'ChatGPT', description: 'Advanced conversational AI model', category: 'Assistant', tool_type: 'text_generation', url: 'https://chat.openai.com', order_index: 5, importance: 'essential', is_active: true },
        { title: 'Pletor / Weavy', description: 'Collaboration and generation tools', category: 'Workflow', tool_type: 'other', url: 'https://weavy.com', order_index: 6, importance: 'essential', is_active: true }
    ]);
    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Successfully updated toolbox items!');
    }
}
run();
