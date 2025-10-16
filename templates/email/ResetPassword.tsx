export default function Template_ResetPassswordEmail(_: { token: string }) {
    return (
        <body>
            <table align="center">
                <tr>
                    <td align="center" style={{ paddingBottom: "30px" }}>
                        <img src={`${process.env.NEXT_PUBLIC_URL}/images/logo.png`} style={{ width: "450px", height: "auto" }} />
                    </td>
                </tr>

                <tr>
                    <td>
                        <table>
                            <tr>
                                <td>LINK:</td>
                                <td>
                                    <a href={`${process.env.NEXT_PUBLIC_URL}/resetPassword?token=${_.token}`}>{`${process.env.NEXT_PUBLIC_URL}/resetPassword?token=${_.token}`}</a>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>

                <tr>
                    <td align="center" style={{ paddingTop: "30px" }}>
                        <img src={`${process.env.NEXT_PUBLIC_URL}/images/logo-small.png`} style={{ width: "100px", height: "auto" }} />
                    </td>
                </tr>
            </table>
        </body>
    );
}
