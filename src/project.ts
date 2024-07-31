import { collections } from "./db";
import { ProjectModel } from "./models";

export const all = async (): Promise<ProjectModel[]> => {
    let cursor = collections.projects?.find({});
    let result = await cursor?.toArray();

    if (result === undefined || result.length == 0) {
        return [];
    }
    let rows = result as ProjectModel[];
    return rows;
}
