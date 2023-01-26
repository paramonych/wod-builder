import { Program } from"./workout";
import { Athlete } from "./athlete";

export interface Competition {
    id: string;
    ownerId: string;
    created: Date;
    startDate: Date;
    endDate: Date;
    workout: Program;
    rivals: Rival[];
    price: number | null;
    reward: CompetitionReward[];
}

export interface Rival {
    id: string;
    athlete: Athlete;
    status: RivalStatus;
    invitedAt: Date;
    joinedAt: Date;
    startedAt: Date;
    endedAt: Date;
}

export interface CompetitionReward {
    position: number;
    reward: number;
    rewardType: CompetitionRewardType;
}

export enum RivalStatus {
    Invited, Joined, Started, Ended
}

export enum CompetitionRewardType {
    Fixed, Percent
}