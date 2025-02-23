const supabase = require('../src/supabaseClient'); // Adjust the path if necessary

const storeAuthState = async (userId, newAuthState) => {
    try {
        // Retrieve the current auth state
        const { data: currentStateData, error: retrieveError } = await supabase
            .from('auth_states')
            .select('auth_state')
            .eq('user_id', userId)
            .single();

        if (retrieveError && retrieveError.code !== 'PGRST116') {
            console.error('Error retrieving current auth state:', retrieveError);
            return;
        }

        const currentAuthState = currentStateData ? currentStateData.auth_state : null;

        // Check if the new auth state is different from the current auth state
        if (JSON.stringify(currentAuthState) !== JSON.stringify(newAuthState)) {
            const { data, error } = await supabase
                .from('auth_states')
                .upsert({ user_id: userId, auth_state: newAuthState });

            if (error) {
                console.error('Error storing auth state:', error);
            } else {
                console.log('Auth state stored successfully:', data);
            }
        } else {
            console.log('Auth state has not changed, no need to update.');
        }
    } catch (error) {
        console.error('Error storing auth state:', error);
    }
};

module.exports = storeAuthState;