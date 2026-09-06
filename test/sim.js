import { roundRobinService } from '../src/services/roundRobin.js';
import { formatTrashDutyAlert, formatTrashStatus } from '../src/utils/formatters.js';

console.log('--------------------------------------------------');
console.log('🤖 BHAVANAM BOT - CLI SIMULATION RUN');
console.log('--------------------------------------------------\n');

console.log('📋 Current Status Dashboard:');
const status1 = roundRobinService.getStatus();
console.log(formatTrashStatus(status1));

console.log('\n--------------------------------------------------');
console.log('🚀 Triggering /trash command (1st time)...');
const trigger1 = roundRobinService.triggerDuty('CLI Simulation');
if (trigger1.success) {
  console.log(formatTrashDutyAlert(trigger1.assignedMember, trigger1.nextMember));
}

console.log('\n--------------------------------------------------');
console.log('🚀 Triggering /trash command (2nd time)...');
const trigger2 = roundRobinService.triggerDuty('CLI Simulation');
if (trigger2.success) {
  console.log(formatTrashDutyAlert(trigger2.assignedMember, trigger2.nextMember));
}

console.log('\n--------------------------------------------------');
console.log('📋 Updated Status Dashboard:');
const status2 = roundRobinService.getStatus();
console.log(formatTrashStatus(status2));
console.log('\n--------------------------------------------------');
