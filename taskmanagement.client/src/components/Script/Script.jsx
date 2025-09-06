import { useEffect } from "react";
import PropTypes from "prop-types";

const Script = ({ src, async = false, defer = false, onLoad, onError }) => {
    useEffect(() => {
        const existingScript = document.querySelector(`script[src="${src}"]`);
        if (existingScript) {
            if (existingScript.complete || existingScript.readyState === 'complete') {
                onLoad?.();
            }
            return;
        }

        const script = document.createElement("script");
        script.src = src;
        script.async = async;
        script.defer = defer;

        script.onload = () => {
            console.log(`Script loaded: ${src}`);
            // Đảm bảo DOM đã sẵn sàng
            if (document.readyState === 'complete' || document.readyState === 'interactive') {
                onLoad?.();
            }
        };

        script.onerror = (error) => {
            console.error(`Script error: ${src}`, error);
            onError?.(error);
        };

        document.head.appendChild(script);

        return () => {
            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
        };
    }, [src, async, defer, onLoad, onError]);

    return null;
};

// Khai báo PropTypes
Script.propTypes = {
    src: PropTypes.string.isRequired,
    async: PropTypes.bool,
    defer: PropTypes.bool,
    onLoad: PropTypes.func,
    onError: PropTypes.func
};

export default Script;