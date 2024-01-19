import { FriendType } from "./types";

export function update_followd_friend_type(old_type:FriendType | undefined):FriendType {
    switch(old_type){
        case 'BLOCKING':
            return 'BLOCKING';
        case 'FOLLOWING':
        case 'FRIEND':
            return 'FRIEND';
        default:
            return 'FOLLOWED';
    }
}

export function update_folloing_friend_type(old_type:FriendType | undefined):FriendType {
    switch(old_type){
        case 'BLOCKING':
            return 'BLOCKING';
        case 'FOLLOWED':
        case 'FRIEND':
            return 'FRIEND';
        case 'FOLLOWING':
        default:
            return 'FOLLOWING';
    }
}
