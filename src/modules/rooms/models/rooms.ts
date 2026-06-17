export interface RoomType {
    id: string;
    name:string;
    roomCount:number;
    size:number;
    price:number;
}

export interface Room {
    id:string;
    name:string;
    type:RoomType;
    isAvailable:boolean;
}