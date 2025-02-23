const supabase = require('../src/supabaseClient'); // Adjust the path if necessary

const retrieveAuthState = async (userId) => {
    try {
        const { data, error } = await supabase
            .from('auth_states')
            .select('auth_state')
            .eq('user_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Error retrieving auth state:', error);
            return null;
        } else if (!data) {
            console.log('No auth state found for user:', userId);
            return null;
        } else {
            console.log('Auth state retrieved successfully:', data);
            return data.auth_state;
        }
    } catch (error) {
        console.error('Error retrieving auth state:', error);
        return null;
    }
};

module.exports = retrieveAuthState;