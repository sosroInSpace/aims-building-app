import { JC_Utils } from "@/app/Utils";
import { ContactModel } from "@/app/models/Contact";

export default function Template_ContactEmail(_: ContactModel) {
    return (
        <div>
            <table>
                <tr>
                    <td>NAME:</td>
                    <td>{_.Name}</td>
                </tr>

                <tr>
                    <td>EMAIL:</td>
                    <td>{_.Email}</td>
                </tr>

                {!JC_Utils.stringNullOrEmpty(_.Phone) && (
                    <tr>
                        <td>PHONE:</td>
                        <td>{_.Phone}</td>
                    </tr>
                )}

                <tr>
                    <td>MESSAGE:</td>
                    <td>{_.Message}</td>
                </tr>
            </table>
        </div>
    );
}
