import WebApp from "@twa-dev/sdk";

export const useTelegram = () => {
    const user = WebApp.initDataUnsafe?.user;

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
            light: () =>
                WebApp.HapticFeedback.impactOccurred("light"),
            medium: () =>
                WebApp.HapticFeedback.impactOccurred("medium"),
            heavy: () =>
                WebApp.HapticFeedback.impactOccurred("heavy"),
            success: () =>
                WebApp.HapticFeedback.notificationOccurred("success"),
            error: () =>
                WebApp.HapticFeedback.notificationOccurred("error"),
            warning: () =>
                WebApp.HapticFeedback.notificationOccurred("warning"),
        },

        backButton: {
            show: (callback: () => void) => {
                WebApp.BackButton.show();
                WebApp.BackButton.onClick(callback);
            },
            hide: () => {
                WebApp.BackButton.hide();
                WebApp.BackButton.offClick(() => {});
            },
        },

        mainButton: {
            show: (text: string, callback: () => void) => {
                WebApp.MainButton.setText(text);
                WebApp.MainButton.show();
                WebApp.MainButton.onClick(callback);
            },
            hide: () => {
                WebApp.MainButton.hide();
                WebApp.MainButton.offClick(() => {});
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