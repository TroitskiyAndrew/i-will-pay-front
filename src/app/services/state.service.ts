import { computed, effect, Injectable, Signal, signal } from '@angular/core';
import { ApiService } from './api.service';
import { IMember, IPayment, IPaymentState, IRoom, IRoomState, IShare, ISplittedMembers, IUser, SocketAction, SocketMessage } from '../models/models';
import { SocketService } from './socket.service';
import { getNewPayment } from '../constants/constants';

@Injectable({
  providedIn: 'root'
})
export class StateService {

  appLink = 'https://t.me/I_WillPay_bot'
  user = signal<IUser>({ id: '', telegramId: 0, name: '' });
  roomId = signal<string>('');
  roomLink = computed(() => `${this.appLink}?startapp=roomId=${this.roomId()}`)
  rooms = signal<IRoom[]>([]);
  roomStatesMap = signal<Map<string, IRoomState>>(new Map());
  totalState = computed(() => {
    const roomStatesMap = this.roomStatesMap();
    return [...roomStatesMap.values()].reduce<Omit<IRoomState, 'debts'>>((res, state) => {
      if (state.unchecked) {
        res.unchecked = true;
      }
      if (state.hasUnsharedPayment) {
        res.hasUnsharedPayment = true;
      }
      res.balance += state.balance;
      return res;
    }, { balance: 0, unchecked: false, hasUnsharedPayment: false });

  });
  roomStatesCash = new Map<string, IRoomState>()
  roomsMap = computed(() => new Map(this.rooms().map(room => [room.id, room])));
  roomIds = computed(() => this.rooms().map(room => room.id));
  currentRoom = signal<IRoom | null>(null);

  payments = signal<IPayment[]>([]);
  paymentsMap = computed(() => new Map(this.payments().map(payment => [payment.id, payment])));
  paymentStatesMap = signal<Map<string, IPaymentState>>(new Map());
  paymentIds = computed(() => this.payments().map(payment => payment.id));
  paymentsShowCount = signal<number>(0);
  paymentsToShow = computed(() => this.paymentIds().slice(0, this.paymentsShowCount()));

  shareIdsMapBaPayment = signal<Map<string, string[]>>(new Map())
  sharesMap = signal<Map<string, IShare>>(new Map());

  members = signal<IMember[]>([])
  memberIds = signal<string[]>([])
  membersMap = signal<Map<string, IMember>>(new Map());
  membersMapByUser = signal<Map<string, IMember>>(new Map());
  usersMap = new Map<string, IUser>()

  editPaymentId = signal('');
  newPayment = getNewPayment('init');

  showDebts = signal<boolean>(false);
  showDebtsMenu = signal<boolean>(false);
  showMembers = signal<boolean>(false);
  showMembersMenu = signal<boolean>(false);
  showPayments = signal<boolean>(false);
  showPaymentsMenu = signal<boolean>(false);

  constructor(private apiService: ApiService, private socketService: SocketService) {
    effect(async () => {
      const rooms = this.rooms();
      if(rooms.length === 1){
        this.roomId.set(rooms[0].id)
      }
      this.socketService.init(this.user().id, rooms.map(room => room.id))
    })
    effect(async () => {
      const members = this.members();
      const membersMap = new Map()
      const membersMapByUser = new Map()
      const splittedMembers = members.reduce<ISplittedMembers>((res, member) => {
        membersMap.set(member.id, member)
        membersMapByUser.set(member.userId, member)
        if (member.userId === member.payer) {
          res.payers.push(member.id);
        } else {
          res[member.payer] = res[member.payer] ? [...res[member.payer], member.id] : [member.id]
        }
        return res;
      }, { payers: [] } as ISplittedMembers);
      members.forEach(async member => {
        if(!this.usersMap.has(member.userId)){
          const user = await this.apiService.getUser(member.userId);
          this.usersMap.set(user!.id, user!)
        }
      })
      const memberIds: string[] = []
      splittedMembers.payers.forEach(payer => {
        memberIds.push(payer)
        const userId = membersMap.get(payer).userId
        if (splittedMembers[userId]) {
          memberIds.push(...splittedMembers[userId])
        }
      });
      this.membersMapByUser.set(membersMapByUser)
      this.membersMap.set(membersMap)
      this.memberIds.set(memberIds)
    })
    effect(async () => {
      const roomId = this.roomId();
      const rooms = this.rooms();
      this.currentRoom.set(rooms.find(room => room.id === roomId) || null);
    })
    effect(async () => {
      const user = this.user();
      if (!user.id) {
        return
      }
      this.newPayment = getNewPayment(user.id)
      const rooms = this.rooms();
      const roomStatesMap = new Map();
      await Promise.all(rooms.map(async room => {
        const roomState = this.roomStatesCash.get(room.id) || await this.getRoomState(room.id, user.id);
        this.roomStatesCash.set(room.id, roomState)
        roomStatesMap.set(room.id, roomState);
      }))
      this.roomStatesMap.set(roomStatesMap);
    });
    effect(async () => {
      const currentRoom = this.currentRoom();
      if (!currentRoom) {
        this.payments.set([]);
        this.members.set([]);
        this.showDebts.set(false)
        this.showMembers.set(false)
        this.showPayments.set(false)
        return;
      }
      const payments = await this.apiService.getPayments(currentRoom.id) || []
      const members = await this.apiService.getMembers(currentRoom.id) || [];
      this.members.set(members);
      this.payments.set([...payments, this.newPayment].reverse());
    });
    effect(async () => {
      const user = this.user();
      if (!user.id) {
        return
      }
      const payments = this.payments();
      const paymentStatesMap = new Map<string, IPaymentState>();
      const sharesMap = new Map<string, IShare>();
      const shareIdsMapBaPayment = new Map<string, string[]>()
      await Promise.all(payments.map(async payment => {
        const shares = await this.apiService.getShares(payment.id) || [];

        const isPayer = payment.payer === user.id;
        let balance = 0;
        let unchecked = false
        const shareIds: string[] = [];
        shares.forEach(share => {
          shareIds.push(share.id)
          sharesMap.set(share.id, share)
          if (isPayer) {
            if (share.payer !== user.id) {
              balance += share.balance
            }
          } else if (share.payer === user.id) {
            balance -= share.balance;

          }
          if (share.payer === user.id && !share.confirmedByUser) {
            unchecked = true;
          }
          if (share.paymentPayer === user.id && !share.confirmedByPayer) {
            unchecked = true;
          }
        });
        shareIdsMapBaPayment.set(payment.id, shareIds)
        paymentStatesMap.set(payment.id, {
          balance,
          unchecked,
          amount: payment.amount
        })
      }))
      this.sharesMap.set(sharesMap);
      this.shareIdsMapBaPayment.set(shareIdsMapBaPayment);
      console.log('paymentStatesMap')
      this.paymentStatesMap.set(paymentStatesMap);
    });
    effect(() => {
      if(this.showDebts()){
        this.showMembersMenu.set(false)
        this.showPaymentsMenu.set(false)
      } else {
        this.showMembersMenu.set(true)
        this.showPaymentsMenu.set(true)
      }
    })
    effect(() => {
      if(this.showMembers()){
        this.showDebtsMenu.set(false)
        this.showPaymentsMenu.set(false)
      } else {
        this.showDebtsMenu.set(true)
        this.showPaymentsMenu.set(true)
      }
    })
    effect(() => {
      if(this.showPayments()){
        this.showDebtsMenu.set(false)
        this.showMembersMenu.set(false)
      } else {
        this.showDebtsMenu.set(true)
        this.showMembersMenu.set(true)
      }
    })


    this.socketService.onMessage(SocketAction.UpdateUser, (data: SocketMessage<SocketAction.UpdateUser>) => {
      this.user.set(data.user);
    })
    this.socketService.onMessage(SocketAction.AddRoom, (data: SocketMessage<SocketAction.AddRoom>) => {
      this.addRoom(data.room);
    })
    this.socketService.onMessage(SocketAction.UpdateRoom, (data: SocketMessage<SocketAction.UpdateRoom>) => {
      this.updateRoom(data.room)
    })
    this.socketService.onMessage(SocketAction.AddMember, (data: SocketMessage<SocketAction.AddMember>) => {
      if (this.roomId() === data.member.roomId) {
        this.addMember(data.member);
      }
    })
    this.socketService.onMessage(SocketAction.UpdateMember, (data: SocketMessage<SocketAction.UpdateMember>) => {
      if (this.roomId() === data.member.roomId) {
        this.updateMember(data.member);
      }
    })
    this.socketService.onMessage(SocketAction.AddPayment, (data: SocketMessage<SocketAction.AddPayment>) => {
      if (this.roomId() === data.payment.roomId) {
        this.addPayment(data.payment)
      }
    })
    this.socketService.onMessage(SocketAction.UpdatePayment, (data: SocketMessage<SocketAction.UpdatePayment>) => {
      if (this.roomId() === data.payment.roomId) {
        this.updatePayment(data.payment)
      }
    })
    this.socketService.onMessage(SocketAction.DeletePayment, (data: SocketMessage<SocketAction.DeletePayment>) => {
      const payments = this.payments()
      if (payments.find(payment => payment.id === data.id)) {
        this.deletePayment(data.id)
      }
    })
    this.socketService.onMessage(SocketAction.AddShare, (data: SocketMessage<SocketAction.AddShare>) => {
      const share = data.share;
      if (this.roomId() === share.roomId) {
        this.addShare(share)

      }
    })
    this.socketService.onMessage(SocketAction.UpdateShare, (data: SocketMessage<SocketAction.UpdateShare>) => {
      const share = data.share;
      if (this.roomId() === share.roomId) {
        this.updateShare(data.share)
      }
    })
    this.socketService.onMessage(SocketAction.DeleteShare, (data: SocketMessage<SocketAction.DeleteShare>) => {
      const shareId = data.id;
      if (this.sharesMap().has(shareId)) {
        this.deleteShare(shareId, data.paymentId)
      }
    })
  }
  updateDelay = 300;
  newRoomsMap: Map<string, IRoom> | null = null
  addRoom(room: IRoom) {
    if (!this.newRoomsMap) {
      this.newRoomsMap = new Map();
      setTimeout(() => this.addRooms(), this.updateDelay);
    }
    this.newRoomsMap.set(room.id, room);
  }
  addRooms() {
    this.rooms.update(rooms => [...rooms, ...this.newRoomsMap!.values()]);
    this.newRoomsMap = null;
  }

  updateRoomsMap: Map<string, IRoom> | null = null
  updateRoom(room: IRoom) {
    if (!this.updateRoomsMap) {
      this.updateRoomsMap = new Map();
      setTimeout(() => this.updateRooms(), this.updateDelay);
    }
    this.updateRoomsMap.set(room.id, room);
  }
  updateRooms() {
    this.rooms.update(rooms => {
      for (const room of [...this.updateRoomsMap!.values()]) {
        const targeRoomIndex = rooms.findIndex(storedRoom => room.id === storedRoom.id);
        rooms[targeRoomIndex] = room
      }
      return [...rooms]
    })
    this.updateRoomsMap = null;
  }

  newMembersMap: Map<string, IMember> | null = null
  addMember(member: IMember) {
    if (!this.newMembersMap) {
      this.newMembersMap = new Map();
      setTimeout(() => this.addMembers(), this.updateDelay);
    }
    this.newMembersMap.set(member.id, member);
  }
  addMembers() {
    const addedMembers = [...this.newMembersMap!.values()];
    this.members.update(members => [...members, ...this.newMembersMap!.values()]);
    addedMembers.forEach(member => this.getRoomState(member.roomId, this.user().id).then(roomState => {
      this.roomStatesCash.set(member.roomId, roomState);
      this.roomStatesMap.update(roomStatesMap => new Map([...roomStatesMap.entries(), [member.roomId, roomState]]))
    }))
    this.newMembersMap = null;
  }

  updateMembersMap: Map<string, IMember> | null = null
  updateMember(member: IMember) {
    if (!this.updateMembersMap) {
      this.updateMembersMap = new Map();
      setTimeout(() => this.updateMembers(), this.updateDelay);
    }
    this.updateMembersMap.set(member.id, member);
  }
  updateMembers() {
    const updateMembers = [...this.updateMembersMap!.values()];
    this.members.update(members => {
      for (const member of [...this.updateMembersMap!.values()]) {
        const targeMemberIndex = members.findIndex(storedMember => member.id === storedMember.id);
        members[targeMemberIndex] = member
      }
      return [...members]
    })
    updateMembers.forEach(member => this.getRoomState(member.roomId, this.user().id).then(roomState => {
      this.roomStatesCash.set(member.roomId, roomState);
      this.roomStatesMap.update(roomStatesMap => new Map([...roomStatesMap.entries(), [member.roomId, roomState]]))
    }))
    this.updateMembersMap = null;
  }

  newPaymentsMap: Map<string, IPayment> | null = null
  addPayment(payment: IPayment) {
    if (!this.newPaymentsMap) {
      this.newPaymentsMap = new Map();
      setTimeout(() => this.addPayments(), this.updateDelay);
    }
    this.newPaymentsMap.set(payment.id, payment);
  }
  addPayments() {
    const addedPayments = [...this.newPaymentsMap!.values()];
    this.payments.update(payments => [...payments, ...this.newPaymentsMap!.values()]);
    addedPayments.forEach(payment => this.getRoomState(payment.roomId, this.user().id).then(roomState => {
      this.roomStatesCash.set(payment.roomId, roomState);
      this.roomStatesMap.update(roomStatesMap => new Map([...roomStatesMap.entries(), [payment.roomId, roomState]]))
    }))
    this.newPaymentsMap = null;
  }

  updatePaymentsMap: Map<string, IPayment> | null = null
  updatePayment(payment: IPayment) {
    if (!this.updatePaymentsMap) {
      this.updatePaymentsMap = new Map();
      setTimeout(() => this.updatePayments(), this.updateDelay);
    }
    this.updatePaymentsMap.set(payment.id, payment);
  }
  updatePayments() {
    const updatePayments = [...this.updatePaymentsMap!.values()];
    this.payments.update(payments => {
      for (const payment of [...updatePayments]) {
        const targePaymentIndex = payments.findIndex(storedPayment => payment.id === storedPayment.id);
        payments[targePaymentIndex] = payment
      }
      return [...payments]
    })
    updatePayments.forEach(payment => this.getRoomState(payment.roomId, this.user().id).then(roomState => {
      this.roomStatesCash.set(payment.roomId, roomState);
      this.roomStatesMap.update(roomStatesMap => new Map([...roomStatesMap.entries(), [payment.roomId, roomState]]))
    }))

    this.updatePaymentsMap = null;
  }

  deletePaymentsMap: Map<string, string> | null = null
  deletePayment(paymentId: string) {
    if (!this.deletePaymentsMap) {
      this.deletePaymentsMap = new Map();
      setTimeout(() => this.deletePayments(), this.updateDelay);
    }
    this.deletePaymentsMap.set(paymentId, paymentId);
  }
  deletePayments() {
    [...this.deletePaymentsMap!.keys()].forEach(paymentId => {
      const roomId = this.paymentsMap().get(paymentId)?.roomId || '';
      this.getRoomState(roomId, this.user().id).then(roomState => {
        this.roomStatesCash.set(roomId, roomState);
        this.roomStatesMap.update(roomStatesMap => new Map([...roomStatesMap.entries(), [roomId, roomState]]))
      })
    })
    this.payments.update(payments => payments.filter(payment => !this.deletePaymentsMap!.has(payment.id)))
    this.deletePaymentsMap = null;
  }

  newSharesMap: Map<string, IShare> | null = null
  addShare(share: IShare) {
    if (!this.newSharesMap) {
      this.newSharesMap = new Map();
      setTimeout(() => this.addShares(), this.updateDelay);
    }
    this.newSharesMap.set(share.id, share);
  }
  addShares() {
    let shareIdsMapBaPayment = this.shareIdsMapBaPayment();
    let sharesMap = this.sharesMap();
    const addedShares = [...this.newSharesMap!.values()];
    for (const share of addedShares) {
      const paymentShareIds = shareIdsMapBaPayment.get(share.paymentId) || [];
      paymentShareIds.push(share.id);
      shareIdsMapBaPayment = new Map([...shareIdsMapBaPayment.entries(), [share.paymentId, paymentShareIds]]);
      sharesMap = new Map([...sharesMap.entries(), [share.id, share]]);
    }
    addedShares.forEach(share => this.getRoomState(share.roomId, this.user().id).then(roomState => {
      this.roomStatesCash.set(share.roomId, roomState);
      this.roomStatesMap.update(roomStatesMap => new Map([...roomStatesMap.entries(), [share.roomId, roomState]]))
    }))
    this.shareIdsMapBaPayment.set(shareIdsMapBaPayment)
    this.sharesMap.set(sharesMap)
    this.newSharesMap = null;
  }

  updateSharesMap: Map<string, IShare> | null = null
  updateShare(share: IShare) {
    if (!this.updateSharesMap) {
      this.updateSharesMap = new Map();
      setTimeout(() => this.updateShares(), this.updateDelay);
    }
    this.updateSharesMap.set(share.id, share);
  }
  updateShares() {

    [...this.updateSharesMap!.values()].forEach(share => {
      this.updatePayment(this.paymentsMap().get(share.paymentId)!)
    })
    const updatedShares = [...this.updateSharesMap!.values()];
    updatedShares.forEach(share => this.getRoomState(share.roomId, this.user().id).then(roomState => {
      this.roomStatesCash.set(share.roomId, roomState);
      this.roomStatesMap.update(roomStatesMap => new Map([...roomStatesMap.entries(), [share.roomId, roomState]]))
    }))

    this.updateSharesMap = null;
  }

  deleteSharesMap: Map<string, string> | null = null
  deleteShare(shareId: string, paymentId: string) {
    if (!this.deleteSharesMap) {
      this.deleteSharesMap = new Map();
      setTimeout(() => this.deleteShares(), this.updateDelay);
    }
    this.deleteSharesMap.set(shareId, paymentId);
  }
  deleteShares() {
    let shareIdsMapBaPayment = this.shareIdsMapBaPayment();
    const sharesMap = this.sharesMap();
    const roomIds: string[] = []
    for (const [shareId, paymentId] of [...this.deleteSharesMap!.entries()]) {
      roomIds.push(sharesMap.get(shareId)?.roomId || '')
      const paymentShareIds = shareIdsMapBaPayment.get(paymentId) || [];
      shareIdsMapBaPayment = new Map([...shareIdsMapBaPayment.entries(), [paymentId, paymentShareIds.filter(id => id !== shareId)]])
      sharesMap.delete(shareId)
    }
    roomIds.forEach(roomId => {
      this.getRoomState(roomId, this.user().id).then(roomState => {
        this.roomStatesCash.set(roomId, roomState);
        this.roomStatesMap.update(roomStatesMap => new Map([...roomStatesMap.entries(), [roomId, roomState]]))
      })
    })
    this.sharesMap.set(sharesMap);
    this.shareIdsMapBaPayment.set(shareIdsMapBaPayment);
    this.deleteSharesMap = null;
  }

  async init() {
    const auth = await this.apiService.auth()
    const { user, roomId } = auth!;
    this.user.set(user);
    this.roomId.set(roomId || '');
    const rooms = await this.apiService.getRooms() || [];
    console.log('rooms', rooms)
    this.rooms.set(rooms);
  }

  async getRoomState(roomId: string, userId: string): Promise<IRoomState> {
    const { debts, hasUnsharedPayment, unchecked } = await this.apiService.getRoomState(roomId);
    const balance = debts.reduce<number>((res, debt) => {
      if (debt.owner === userId) {
        res += debt.amount;
      } else if (debt.debtor === userId) {
        res -= debt.amount;
      }
      return res
    }, 0)
    return { balance, debts, hasUnsharedPayment, unchecked }
  }
}
