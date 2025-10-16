"use client";

import { JC_Utils } from "../Utils";
import { JC_Post } from "../apiServices/JC_Post";
import { JC_PostRaw } from "../apiServices/JC_PostRaw";
import { JC_Put } from "../apiServices/JC_Put";
import JC_Form from "../components/JC_Form/JC_Form";
import { FieldTypeEnum } from "../enums/FieldType";
import { D_FieldModel_Email, D_FieldModel_Phone } from "../models/ComponentModels/JC_Field";
import { ContactModel } from "../models/Contact";
import styles from "./page.module.scss";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function Page_Contact() {
    const session = useSession();

    // - STATE - //

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [name, setName] = useState<string>(session.data?.user ? `${session.data?.user.FirstName} ${session.data?.user.LastName}` : "");
    const [email, setEmail] = useState<string>(session.data?.user.Email ?? "");
    const [phone, setPhone] = useState<string>(session.data?.user.Phone ?? "");
    const [message, setMessage] = useState<string>("");
    const [rerenderGuid, setRerenderGuid] = useState<string>(JC_Utils.generateGuid());

    // - INITIALISE - //

    useEffect(() => {
        // Focus on first input only if not on mobile
        if (!JC_Utils.isOnMobile()) {
            document.getElementById("contact-name-input")?.focus();
        }
    }, []);

    // - HANDLES - //

    async function handleSubmit() {
        setIsLoading(true);
        let contactData: ContactModel = new ContactModel({
            UserId: session.data?.user?.Id ?? undefined,
            Email: email,
            Phone: phone,
            Message: message,
            Name: name
        });
        await JC_PostRaw("email/contactEmail", contactData);
        await JC_Put<ContactModel>(ContactModel, ContactModel.apiRoute, contactData);
        JC_Utils.showToastSuccess("Thank you for your message!");
        setName(session.data?.user ? `${session.data?.user.FirstName} ${session.data?.user.LastName}` : "");
        setEmail(session.data?.user.Email ?? "");
        setPhone(session.data?.user.Phone ?? "");
        setMessage("");
        setIsLoading(false);
        setRerenderGuid(JC_Utils.generateGuid());
    }

    // - MAIN - //

    return (
        <div className={styles.mainContainer}>
            {/* Form */}
            <div className={styles.formContainer}>
                {/* Feedback */}
                <div className={styles.feedbackText}>
                    We&apos;d love to hear
                    <br />
                    your feedback!
                </div>

                {/* Form */}
                <JC_Form
                    key={rerenderGuid}
                    submitButtonText="Submit"
                    onSubmit={handleSubmit}
                    isLoading={isLoading}
                    fields={[
                        // Name
                        {
                            inputId: "contact-name-input",
                            type: FieldTypeEnum.Text,
                            label: "Name",
                            value: name,
                            onChange: newValue => setName(newValue),
                            validate: (v: any) => (JC_Utils.stringNullOrEmpty(v) ? "Enter a name." : ""),
                            readOnly: session.data != null
                        },
                        // Email
                        {
                            ...D_FieldModel_Email(),
                            inputId: "contact-email-input",
                            value: email,
                            onChange: newValue => setEmail(newValue),
                            readOnly: session.data != null
                        },
                        // Phone
                        {
                            ...D_FieldModel_Phone(!JC_Utils.stringNullOrEmpty(session.data?.user.Phone)),
                            inputId: "contact-phone-input",
                            value: phone,
                            onChange: newValue => setPhone(newValue),
                            readOnly: !JC_Utils.stringNullOrEmpty(session.data?.user.Phone)
                        },
                        // Message
                        {
                            inputId: "contact-message-input",
                            type: FieldTypeEnum.Textarea,
                            label: "Message",
                            value: message,
                            onChange: newValue => setMessage(newValue),
                            validate: (v: any) => (JC_Utils.stringNullOrEmpty(v) ? "Enter a message." : "")
                        }
                    ]}
                />
            </div>
        </div>
    );
}
