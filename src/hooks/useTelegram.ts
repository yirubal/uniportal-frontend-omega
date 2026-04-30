import WebApp from "@twa-dev/sdk";

export const useTelegram = () => {
    const user = WebApp.initDataUnsafe?.user;
    const supportsHaptics = WebApp.isVersionAtLeast?.("6.1") ?? false;

    const safeImpact = (style: "light" | "medium" | "heavy") => {
        if (!supportsHaptics) return;
        WebApp.HapticFeedback.impactOccurred(style);
    };

    const safeNotify = (type: "success" | "error" | "warning") => {
        if (!supportsHaptics) return;
        WebApp.HapticFeedback.notificationOccurred(type);
    };

    return {
        webApp: WebApp,
        initData: WebApp.initData,
        user,
        colorScheme: WebApp.colorScheme,
        themeParams: WebApp.themeParams,

        expand: () => WebApp.expand(),
        close: () => WebApp.close(),

        showAlert: (message: string) =>
            new Promise<void>((resolve) =>
                WebApp.showAlert(message, () => resolve())
            ),

        showConfirm: (message: string) =>
            new Promise<boolean>((resolve) =>
                WebApp.showConfirm(message, (confirmed) => resolve(confirmed))
            ),

        haptic: {
            light: () => safeImpact("light"),
            medium: () => safeImpact("medium"),
            heavy: () => safeImpact("heavy"),
            success: () => safeNotify("success"),
            error: () => safeNotify("error"),
            warning: () => safeNotify("warning"),
        },

        backButton: {
            show: (callback: () => void) => {
                if (!WebApp.isVersionAtLeast?.("6.1")) {
                    return () => {};
                }

                WebApp.BackButton.show();
                WebApp.BackButton.onClick(callback);
                return () => WebApp.BackButton.offClick(callback);
            },
            hide: () => {
                if (!WebApp.isVersionAtLeast?.("6.1")) {
                    return;
                }

                WebApp.BackButton.hide();
            },
        },

        mainButton: {
            show: (text: string, callback: () => void) => {
                WebApp.MainButton.setText(text);
                WebApp.MainButton.show();
                WebApp.MainButton.onClick(callback);
                return () => WebApp.MainButton.offClick(callback);
            },
            hide: () => {
                WebApp.MainButton.hide();
            },
            setLoading: (loading: boolean) => {
                if (loading) {
                    WebApp.MainButton.showProgress();
                } else {
                    WebApp.MainButton.hideProgress();
                }
            },
        },

        downloadFile: (url: string, fileName: string) =>
            WebApp.downloadFile({ url, file_name: fileName }),
    };
};
