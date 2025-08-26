import { useEffect, useState } from "react";
import Script from '../../components/Script';
const Scripts = () => {
    const [isScriptLoaded, setIsScriptLoaded] = useState(false);

    useEffect(() => {
        if (isScriptLoaded) {
            // Tăng delay để đảm bảo DOM sẵn sàng
            setTimeout(() => {
                if (window.init && typeof window.init === 'function') {
                    try {
                        window.init();
                    } catch (error) {
                        console.error('Error initializing script:', error);
                    }
                }
            }, 300); // Tăng lên 300ms
        }
    }, [isScriptLoaded]);

    return (
        <Script
            src="/assets/js/script.js"
            defer={true}
            key={window.location.pathname}
            onLoad={() => setIsScriptLoaded(true)}
            onError={(error) => console.error('Script loading error:', error)}
        />
    );
};

export default Scripts;