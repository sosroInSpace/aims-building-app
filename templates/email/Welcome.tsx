export default function Template_WelcomeEmail(name: string, email: string) {
    return (
        <div>
            <table>
                <tr>
                    <td>WELCOME!</td>
                    <td>{name}</td>
                </tr>

                <tr>
                    <td>EMAIL:</td>
                    <td>{email}</td>
                </tr>
            </table>
        </div>
    );
}
