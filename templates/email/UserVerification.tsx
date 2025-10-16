export default function Template_UserVerificationEmail(_: { token: string }) {
    return (
        <div>
            <table>
                <tr>
                    <td>VERIFICATION LINK:</td>
                    <td>
                        <a href={`${process.env.NEXT_PUBLIC_URL}/userVerification?token=${_.token}`}>{`${process.env.NEXT_PUBLIC_URL}/userVerification?token=${_.token}`}</a>
                    </td>
                </tr>
            </table>
        </div>
    );
}
