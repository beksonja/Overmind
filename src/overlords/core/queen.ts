// Hatchery overlord: spawn and run a dedicated supplier-like hatchery attendant (called after colony has storage)
import {DEFAULT_PRESPAWN, Overlord} from '../Overlord';
import {Hatchery} from '../../hiveClusters/hatchery';
import {Zerg} from '../../zerg/Zerg';
import {Tasks} from '../../tasks/Tasks';
import {OverlordPriority} from '../../priorities/priorities_overlords';
import {profile} from '../../profiler/decorator';
import {CreepSetup} from '../CreepSetup';

export const QueenSetup = new CreepSetup('queen', {
	pattern  : [CARRY, CARRY, MOVE],
	sizeLimit: Infinity,
});

type rechargeObjectType = StructureStorage
	| StructureTerminal
	| StructureContainer
	| StructureLink
	| Tombstone
	| Resource;

@profile
export class QueenOverlord extends Overlord {

	hatchery: Hatchery;
	queens: Zerg[];
	settings: any;

	constructor(hatchery: Hatchery, priority = OverlordPriority.core.queen) {
		super(hatchery, 'supply', priority);
		this.hatchery = hatchery;
		this.queens = this.zerg(QueenSetup.role);
		this.settings = {
			refillTowersBelow: 500,
		};
	}

	init() {
		const amount = 1;
		const prespawn = this.hatchery.spawns.length <= 1 ? 100 : DEFAULT_PRESPAWN;
		this.wishlist(amount, QueenSetup, {prespawn: prespawn});
	}

	private supplyActions(queen: Zerg) {
		// Select the closest supply target out of the highest priority and refill it
		let request = this.hatchery.transportRequests.getPrioritizedClosestRequest(queen.pos, 'supply');
		if (request) {
			queen.task = Tasks.transfer(request.target);
		} else {
			this.rechargeActions(queen); // if there are no targets, refill yourself
		}
	}

	private rechargeActions(queen: Zerg): void {
		if (this.hatchery.link && !this.hatchery.link.isEmpty) {
			queen.task = Tasks.withdraw(this.hatchery.link);
		} else if (this.hatchery.battery && !this.hatchery.battery.isEmpty) {
			queen.task = Tasks.withdraw(this.hatchery.battery);
		} else {
			queen.task = Tasks.recharge();
		}
	}

	private idleActions(queen: Zerg): void {
		if (this.hatchery.link) {
			// Can energy be moved from the link to the battery?
			if (this.hatchery.battery && !this.hatchery.battery.isFull && !this.hatchery.link.isEmpty) {
				// Move energy to battery as needed
				if (queen.carry.energy < queen.carryCapacity) {
					queen.task = Tasks.withdraw(this.hatchery.link);
				} else {
					queen.task = Tasks.transfer(this.hatchery.battery);
				}
			} else {
				if (queen.carry.energy < queen.carryCapacity) { // make sure you're recharged
					if (!this.hatchery.link.isEmpty) {
						queen.task = Tasks.withdraw(this.hatchery.link);
					} else if (this.hatchery.battery && !this.hatchery.battery.isEmpty) {
						queen.task = Tasks.withdraw(this.hatchery.battery);
					}
				}
			}
		} else {
			if (this.hatchery.battery && queen.carry.energy < queen.carryCapacity) {
				queen.task = Tasks.withdraw(this.hatchery.battery);
			}
		}
	}

	private handleQueen(queen: Zerg): void {
		if (queen.carry.energy > 0) {
			this.supplyActions(queen);
		} else {
			this.rechargeActions(queen);
		}
		// If there aren't any tasks that need to be done, recharge the battery from link
		if (queen.isIdle) {
			this.idleActions(queen);
		}
		// // If all of the above is done and hatchery is not in emergencyMode, move to the idle point and renew as needed
		// if (!this.emergencyMode && queen.isIdle) {
		// 	if (queen.pos.isEqualTo(this.idlePos)) {
		// 		// If queen is at idle position, renew her as needed
		// 		if (queen.ticksToLive < this.settings.renewQueenAt && this.availableSpawns.length > 0) {
		// 			this.availableSpawns[0].renewCreep(queen.creep);
		// 		}
		// 	} else {
		// 		// Otherwise, travel back to idle position
		// 		queen.goTo(this.idlePos);
		// 	}
		// }
	}

	run() {
		for (let queen of this.queens) {
			// Get a task
			this.handleQueen(queen);
			// Run the task if you have one; else move back to idle pos
			if (queen.hasValidTask) {
				queen.run();
			} else {
				if (this.queens.length > 1) {
					queen.goTo(this.hatchery.idlePos, {range: 1});
				} else {
					queen.goTo(this.hatchery.idlePos);
				}
			}
		}
	}
}
