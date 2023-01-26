

export interface Access {
    athleteId: string;
    privileges: Privilege[]
}

export interface Privilege {
    type: AccessType;
    point: AccessPoint;
}

enum AccessPoint {
    Complex, Program, Competition 
}

export enum AccessType {
    Read, Write, Admin // whether he can list, change or delete specified AccessPoint objects
}