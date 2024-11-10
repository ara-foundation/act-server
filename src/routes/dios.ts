/**
 * Logos is in the Ara terminology, means the ideas.
 * This module handles the Ara platform's idea hub.
 */
import { Request, Response } from "express";
import { DIOSTransfer } from "../types";
import { getAllV1 } from "../models/projects";

export const randomTags = (): string[] => {
    var words = ["monitor", "program", "application", "keyboard", "javascript", "gaming", "network"];
    var word1 = words[Math.floor(Math.random() * words.length)];
    var word2 = words[Math.floor(Math.random() * words.length)];

    return [word1, word2]
}

/**
 * POST /dios/transfers searchs the app by input, output and app name.
 * 
 * @param req 
 * @param res 
 */
export const onDIOSTransfers = async (req: Request, res: Response) => {
    let search: string = "";
    if (req.query.search) {
        search = req.query.search as string;
    }

    var params = req.body as DIOSTransfer;
    if (!params) {
        return res.status(400).json({message: 'invalid POST body'});
    }

    var projects = await getAllV1();

    var diosTransfers: DIOSTransfer[] = [];
    for (let project of projects) {
        let diosTransfer: DIOSTransfer = project as DIOSTransfer;
        diosTransfer.inputs = randomTags();
        diosTransfer.outputs = randomTags();
        diosTransfers.push(diosTransfer);
    }

    res.json(diosTransfers)
}
