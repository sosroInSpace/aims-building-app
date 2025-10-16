import { JC_Utils_Business } from "@/app/Utils";
import { DefectImageModel } from "@/app/models/DefectImage";
import { O_DefectFindingModel } from "@/app/models/O_DefectFinding";
import { unstable_noStore } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const dynamic = "force-dynamic";

// Generate AI info from defect images using OpenAI GPT-4o
export async function POST(request: NextRequest) {
    try {
        unstable_noStore();

        // Initialize OpenAI client inside the function to avoid build-time errors
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        const { defectId } = await request.json();

        if (!defectId) {
            return NextResponse.json({ error: "Missing 'defectId' parameter" }, { status: 400 });
        }

        // Get all DefectImage records for the defect with signed URLs
        const whereClause = `main."DefectId" = '${defectId}'`;

        const result = await JC_Utils_Business.sqlGetList<DefectImageModel>(DefectImageModel, whereClause, {
            PageSize: undefined,
            PageIndex: undefined,
            Sorts: [{ SortField: "CreatedAt", SortAsc: false }]
        });

        const defectImages = result.ResultList;

        if (!defectImages || defectImages.length === 0) {
            return NextResponse.json(
                {
                    error: "No images found for this defect"
                },
                { status: 404 }
            );
        }

        // Extract signed URLs from the defect images
        const imageUrls: string[] = defectImages.map(image => image.Ex_ImageSignedUrl).filter(url => url != null) as string[];

        if (imageUrls.length === 0) {
            return NextResponse.json(
                {
                    error: "No valid image URLs found for this defect"
                },
                { status: 404 }
            );
        }

        // Get all available defect finding options for AI to choose from
        const defectFindingOptions = await JC_Utils_Business.sqlGetList<O_DefectFindingModel>(O_DefectFindingModel, `main."Deleted" = 'False'`, {
            PageSize: undefined,
            PageIndex: undefined,
            Sorts: [
                { SortField: "SortOrder", SortAsc: true },
                { SortField: "Name", SortAsc: true }
            ]
        });

        const availableOptions = defectFindingOptions.ResultList || [];

        // Format options for AI prompt
        const optionsText = availableOptions.map(option => `- Code: "${option.Code}", Name: "${option.Name}", Information: "${option.Information}"`).join("\n");

        // Call OpenAI with enhanced prompt that includes available options
        const messages = [
            {
                role: "system" as const,
                content: `You are a professional property inspector. You will be shown multiple images from a property inspection. Based on ALL the images combined, identify ALL relevant defects present.

AVAILABLE DEFECT FINDING OPTIONS:
${optionsText}

Your task is to:
1. Select ALL APPROPRIATE defect finding options from the list above based on what you see in the images
2. You can select MULTIPLE options if multiple defects are visible
3. Provide custom name and information overrides ONLY if the selected options need to be more specific for this particular case

Respond in this strict JSON format:
{
  "SelectedOptions": [
    {
      "Code": "<code of defect finding option from the list above>",
      "NameOverride": "<custom name if the default option name needs to be more specific, otherwise null>",
      "InformationOverride": "<custom information if the default option information needs to be more specific, otherwise null>"
    }
  ]
}

IMPORTANT RULES:
- You MUST select SelectedOptions from the available options above
- You can select multiple options if multiple defects are present
- Use "Other" only if no other option fits at all
- Only provide NameOverride/InformationOverride if the default option needs customization for this specific case
- If the default option name and information are adequate, set overrides to null
- If multiple defects are present, include them all in the SelectedOptions array

Only return the JSON. If no issues are found, respond with:
{
  "SelectedOptions": [
    {
      "Code": "Other",
      "NameOverride": "No Major Defects",
      "InformationOverride": "No clear property issues could be identified from the provided images."
    }
  ]
}`
            },
            {
                role: "user" as const,
                content: imageUrls.map((url: string) => ({
                    type: "image_url" as const,
                    image_url: { url }
                }))
            }
        ];

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages,
            max_tokens: 800
        });

        const text = response.choices[0].message.content || "";

        // Attempt to extract JSON
        const jsonMatch = text.match(/{[\s\S]*}/);
        let parsed;

        try {
            parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
        } catch (error) {
            console.error("Failed to parse AI response JSON:", error);
            parsed = null;
        }

        // Validate the response structure and provide fallback
        if (!parsed || !parsed.SelectedOptions || !Array.isArray(parsed.SelectedOptions) || parsed.SelectedOptions.length === 0) {
            parsed = {
                SelectedOptions: [
                    {
                        Code: "Other",
                        NameOverride: "Unknown Defect",
                        InformationOverride: "Could not analyze the defect from the provided images."
                    }
                ]
            };
        }

        // Validate that all selected codes exist in available options
        parsed.SelectedOptions = parsed.SelectedOptions.map((selection: any) => {
            const selectedOption = availableOptions.find(option => option.Code === selection.Code);
            if (!selectedOption) {
                // Fallback to 'Other' if selected code is invalid
                return {
                    Code: "Other",
                    NameOverride: selection.NameOverride || "Unknown Defect",
                    InformationOverride: selection.InformationOverride || "Could not categorize the defect from the provided images."
                };
            }
            return selection;
        });

        return NextResponse.json(parsed);
    } catch (error) {
        console.error("OpenAI error:", error);
        return NextResponse.json({ error: "Failed to analyze images" }, { status: 500 });
    }
}
