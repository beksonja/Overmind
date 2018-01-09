// // Hauler - takes care of remote hauling
//
// import {TaskDeposit} from '../tasks/task_deposit';
// import {AbstractCreep, AbstractSetup} from './Abstract';
// import {TaskGoToRoom} from '../tasks/task_goToRoom';
// import {TaskGoTo} from '../tasks/task_goTo';
// import {profile} from '../lib/Profiler';
//
// @profile
// export class HaulerSetup extends AbstractSetup {
// 	constructor() {
// 		super('hauler');
// 		// Role-specific settings
// 		this.body.pattern = [CARRY, CARRY, MOVE];
// 		this.body.suffix = [WORK, MOVE];
// 		this.body.proportionalPrefixSuffix = false;
// 	}
// }
//
// @profile
// export class HaulerCreep extends AbstractCreep {
// 	assignment: StructureLink | StructureStorage;
// 	miningGroup: IMiningGroup;
//
// 	constructor(creep: Creep) {
// 		super(creep);
// 	}
//
// 	init(): void {
// 		if (!this.assignment || !this.colony.miningGroups) {
// 			return;
// 		}
// 		this.miningGroup = this.colony.miningGroups[this.assignment.ref];
// 	}
//
// 	doDeposit(): void {
// 		let dropoff = this.miningGroup.dropoff;
// 		if (dropoff instanceof StructureLink) {
// 			if (this.miningGroup.availableLinks && this.miningGroup.availableLinks[0]) {
// 				let depositTo = this.miningGroup.availableLinks[0];
// 				this.task = new TaskDeposit(depositTo);
// 			} else {
// 				this.task = new TaskGoTo(dropoff);
// 			}
// 		} else if (dropoff instanceof StructureStorage) {
// 			let requestorContainers = _.map(this.colony.overlord.transportRequests.supply.haul,
// 											request => request.target) as StructureContainer[];
// 			if (requestorContainers.length > 0) {
// 				this.task = new TaskDeposit(requestorContainers[0]);
// 			} else {
// 				this.task = new TaskDeposit(dropoff);
// 			}
// 		}
// 	}
//
// 	requestTask(): void {
// 		// Requests a collection task from the mining group
// 		this.miningGroup.objectiveGroup.assignTask(this);
// 	}
//
// 	newTask(): void {
// 		this.task = null;
// 		if (this.carry.energy == 0) {
// 			this.requestTask(); // Get a collection task from the mining group
// 		} else {
// 			if (this.room == this.miningGroup.dropoff.room) {
// 				this.doDeposit(); // Deposit to the best target
// 			} else {
// 				this.task = new TaskGoToRoom(this.miningGroup.dropoff); // Go back to deposit room
// 			}
// 		}
// 	}
//
// 	onRun(): void {
// 		// Pickup any dropped energy along your route
// 		let droppedEnergy = this.pos.findInRange(this.room.droppedEnergy, 1)[0] as Resource;
// 		if (droppedEnergy) {
// 			this.pickup(droppedEnergy);
// 			if (droppedEnergy.amount > 0.5 * this.carryCapacity) {
// 				this.doDeposit();
// 			}
// 		}
// 		// Repair nearby roads as you go
// 		this.repairNearbyDamagedRoad(); // repair roads if you are capable
// 	}
// }