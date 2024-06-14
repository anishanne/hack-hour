import dotenv from 'dotenv';
dotenv.config();

// A typed wrapper over airtable API

import Airtable from "airtable";

Airtable.configure({
    apiKey: process.env.AIRTABLE_TOKEN
});

if (!process.env.AIRTABLE_BASE) { throw new Error("No Airtable base provided"); }

const base = Airtable.base(process.env.AIRTABLE_BASE);
const users = base("Users");
const sessions = base("Sessions");
const scrapbooks = base("Scrapbook");

type AirtableRecordID = string;

type AirtableUserWrite = {
    "Name": string,
    "Hack Hour ID": string,
    "Slack ID": string,
};

type AirtableUserRead = {
    "Name": string,
    "Hack Hour ID": string,
    "Slack ID": string,
    "Ships": AirtableRecordID[],
    "Sessions": AirtableRecordID[],
    "Minutes (All)": number,
    "Minutes (Approved)": number,
    "Minutes (Banked)": number,
    "Spent (Incl. Pending)": number,
    "Balance (UI)": number,
};

type AirtableSessionWrite = {
    "Session ID": string,
    "Message TS": string,
    "Control TS": string,
    "Code URL": string,
    "User": [AirtableRecordID],
    "Work": string,
    "Minutes": number,
    "Status": "Approved" | "Unreviewed" | "Rejected" | "Banked" | "Requested Re-review",
    "Created At": string,
    "Evidenced": boolean,
    "Activity": boolean,
    "Reason"?: string,
    "Scrapbook"?: [AirtableRecordID] | [],
};

type AirtableSessionRead = {
    "Session ID": string,
    "Message TS": string,
    "Control TS": string,
    "Code URL": string,
    "User": [AirtableRecordID],
    "Work": string,
    "Minutes": number,
    "Status": "Approved" | "Unreviewed" | "Rejected" | "Banked" | "Requested Re-review",
    "Created At": string,
    "Evidenced": boolean,
    "Activity": boolean,
    "Reason": string,
    "Approved Minutes": number,
    "Scrapbook": [AirtableRecordID] | [],
};

type AirtableScrapbookWrite = {
    "Scrapbook TS": string,
    "Scrapbook URL": string,
    "Sessions": AirtableRecordID[],
    "User": [AirtableRecordID],
    "Attachments": {
        "url": string
    }[],
    "Text": string
};

type AirtableScrapbookRead = AirtableScrapbookWrite;

export const AirtableAPI = {
    User: {
        async find(record: string): Promise<{id: AirtableRecordID, fields: AirtableUserRead} | null> {
            const records = await sessions.find(record);

            if (!records) { return null; }

            return {id: records.id, fields: records.fields as AirtableUserRead};
        },

        async lookupById(id: string): Promise<{id: AirtableRecordID, fields: AirtableUserRead} | null> {
            const records = await users.select({
                filterByFormula: `{Hack Hour ID} = "${id}"`
            }).all();

            if (records.length === 0) { return null; }
            return {id: records[0].id, fields: records[0].fields as AirtableUserRead};
        },

        async lookupBySlack(slack: string): Promise<{id: AirtableRecordID, fields: AirtableUserRead} | null> {
            const records = await users.select({
                filterByFormula: `{Slack ID} = "${slack}"`
            }).all();

            if (records.length === 0) { return null; }
            return {id: records[0].id, fields: records[0].fields as AirtableUserRead};
        },

        async create(user: AirtableUserWrite): Promise<{id: AirtableRecordID, fields: AirtableUserWrite}> {
            const record = await users.create([{
                "fields": user
            }]);

            return {id: record[0].id, fields: record[0].fields as AirtableUserWrite};
        },

        async update(id: AirtableRecordID, user: Partial<AirtableUserWrite>): Promise<{id: AirtableRecordID, fields: AirtableUserWrite}> {
            const records = await users.update([{
                "id": id,
                "fields": user
            }]);

            return {id: records[0].id, fields: records[0].fields as AirtableUserWrite};
        },

        async findAll(): Promise<{id: AirtableRecordID, fields: AirtableUserRead}[]> {
            const records = await users.select().all();

            return records.map(record => ({id: record.id, fields: record.fields as AirtableUserRead}));
        }
    },
    Session: {
        async find(record: string): Promise<{id: AirtableRecordID, fields: AirtableSessionRead} | null> {
            const records = await sessions.find(record);

            if (!records) { return null; }

            return {id: records.id, fields: records.fields as AirtableSessionRead};
        },

        async create(session: AirtableSessionWrite): Promise<{id: AirtableRecordID, fields: AirtableSessionWrite}> {
            const record = await sessions.create([{
                "fields": session
            }]);

            return {id: record[0].id, fields: record[0].fields as AirtableSessionWrite};
        },

        async update(id: AirtableRecordID, session: Partial<AirtableSessionWrite>): Promise<{id: AirtableRecordID, fields: AirtableSessionWrite}> {
            const records = await sessions.update([{
                "id": id,
                "fields": session
            }]);

            return {id: records[0].id, fields: records[0].fields as AirtableSessionWrite};
        },
        
        async findAll(): Promise<{id: AirtableRecordID, fields: AirtableSessionRead}[]> {
            const records = await sessions.select().all();

            return records.map(record => ({id: record.id, fields: record.fields as AirtableSessionRead}));
        }
    },
    Scrapbook: {
        async find(record: string): Promise<{id: AirtableRecordID, fields: AirtableScrapbookRead} | null> {
            const records = await scrapbooks.find(record);

            if (!records) { return null; }

            return {id: records.id, fields: records.fields as unknown as AirtableScrapbookRead};
        },

        async create(scrapbook: AirtableScrapbookWrite): Promise<{id: AirtableRecordID, fields: AirtableScrapbookWrite}> {
            const record = await scrapbooks.create([{
                "fields": scrapbook as any
            }]);

            return {id: record[0].id, fields: record[0].fields as unknown as AirtableScrapbookWrite};
        },

        async update(id: AirtableRecordID, session: Partial<AirtableScrapbookWrite>): Promise<{id: AirtableRecordID, fields: AirtableScrapbookWrite}> {
            const records = await scrapbooks.update([{
                "id": id,
                "fields": session as any
            }]);

            return {id: records[0].id, fields: records[0].fields as unknown as AirtableScrapbookWrite};
        },
    },    
};