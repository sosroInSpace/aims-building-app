interface Template_TwoFactorAuthEmailProps {
    code: string;
    base64MainLogo?: string;
}

export default function Template_TwoFactorAuthEmail(_: Template_TwoFactorAuthEmailProps) {
    const isServer = typeof window === "undefined";

    return (
        <body>
            <table align="center">
                <tr>
                    <td align="center" style={{ paddingBottom: "30px" }}>
                        <img src={isServer && _.base64MainLogo ? `data:image/jpeg;base64,${_.base64MainLogo}` : `${process.env.NEXT_PUBLIC_URL}/images/logo.png`} style={{ width: "450px", height: "auto" }} alt="Logo" />
                    </td>
                </tr>

                <tr>
                    <td>
                        <table>
                            <tr>
                                <td style={{ fontSize: "18px", fontWeight: "bold", paddingBottom: "20px" }}>Your Two-Factor Authentication Code</td>
                            </tr>
                            <tr>
                                <td style={{ fontSize: "16px", paddingBottom: "20px" }}>Please use the following code to complete your login:</td>
                            </tr>
                            <tr>
                                <td align="center" style={{ paddingBottom: "20px" }}>
                                    <div
                                        style={{
                                            fontSize: "32px",
                                            fontWeight: "bold",
                                            backgroundColor: "#f0f0f0",
                                            padding: "20px",
                                            borderRadius: "8px",
                                            letterSpacing: "8px",
                                            fontFamily: "monospace"
                                        }}
                                    >
                                        {_.code}
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td style={{ fontSize: "14px", color: "#666" }}>This code will expire in 10 minutes. If you didn&#39;t request this code, please ignore this email.</td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
    );
}
