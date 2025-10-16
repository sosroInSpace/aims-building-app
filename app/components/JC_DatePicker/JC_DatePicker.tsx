"use client";

import JC_Field from "../JC_Field/JC_Field";
import styles from "./JC_DatePicker.module.scss";
import { JC_Utils, JC_Utils_Dates } from "@/app/Utils";
import { FieldTypeEnum } from "@/app/enums/FieldType";
import React, { useState } from "react";
import { Calendar } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

export default function JC_DatePicker(
    _: Readonly<{
        overrideClass?: string;
        fieldOverrideClass?: string;
        inputId: string;
        theDate: Date;
        onChange: (newDate: Date) => void;
        calendarOnly?: boolean;
    }>
) {
    // - STATE - //

    const [pickerOpen, setPickerOpen] = useState<boolean>(false);

    // - MAIN - //

    // If calendarOnly is true, just return the calendar
    if (_.calendarOnly) {
        return (
            // @ts-ignore - Calendar component type compatibility issue
            <Calendar showMonthAndYearPickers={false} date={_.theDate} onChange={(newDate: Date) => _.onChange(newDate)} />
        );
    }

    return (
        <div key={_.theDate.toString()} className={`${styles.mainContainer} ${!JC_Utils.stringNullOrEmpty(_.overrideClass) ? _.overrideClass : ""}`}>
            {/* Outside Click Div */}
            {pickerOpen && <div className={styles.outsideClick} onClick={() => setPickerOpen(false)} />}

            {/* Field */}
            <JC_Field
                overrideClass={_.fieldOverrideClass}
                inputOverrideClass={styles.inputOverride}
                inputId={_.inputId}
                type={FieldTypeEnum.Text}
                label="Date Mate"
                value={JC_Utils_Dates.formattedDateString(_.theDate)}
                readOnly
                onClick={() => {
                    setPickerOpen(!pickerOpen);
                }}
            />

            {/* Date Picker */}
            {pickerOpen && (
                // @ts-ignore - Calendar component type compatibility issue
                <Calendar className={styles.datePicker} showMonthAndYearPickers={false} date={_.theDate} color={styles.primaryColor} onChange={(newDate: Date) => _.onChange(newDate)} />
            )}
        </div>
    );
}
