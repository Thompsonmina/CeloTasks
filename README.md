# Celo Tasks
Celo Tasks is a decentralized application built on the the celo blockchain. The basic idea of the DApp is to be a place where people can post verifiable tasks that other people can complete in order to get a bounty. It achieves this idea in a novel way by using locks

## How it Works
Basically we have two main types of users, those who post task along with the attached bounties and those that complete these tasks. Now a person posts a task by submitting relevant details about the task like what it is, what someone has to do to show that the task has been completed, how much bounty is attached to the task, a communications channel where a prospective task complete can use to communicate to the task owner and for how long a task gets to be locked for. On submission the attached bounty is paid into the contract. Now a prospective task completer comes along if she/he feels they have the competence and time to complete the task then they can choose to lock in a task. The act of locking in a task means that for the duration of the lock you you have no competition for that specific task, the task is yours to complete. In order for this mechanism to not be exploited and to ensure only suitable people get to work on the task. To lock a task a you must pay an amount of cusd which is a percentage of the bounty, after you have successfully completed the task, you get both the full bounty plus the amount that was used to lock the task. The owner of the task decides whether a task has been completed or not based on the specific guide set. A task owner may also choose to unlock a task if they do not hear from or see any progress on task after the lock duration has expired in which case the task completer loses their lock deposit. A task owner may also choose to withdraw any task that isn't yet locked in which case they are paid back thoier bounty amount.

## How it can Be Improved
Firstly by adding a native communications channel in app that allows both parties to communicate instead of delegating it to an external process.
Secondly by reducing the power the owner currently has over a prospective task completer either by finding a way to make owners accountable if they maliciously deny a valid task completion we can do this by introducing a channel where a completer that feels wronged can dispute the fact and the community can decide and penalize the owner if foul play is detected. Or 
remove the power completely and allow incentivized members of the community decide if a task has been adequately completed


### Install

```

npm install

```

or 

```

yarn install

```

# Start

```

npm run dev

```

# Build

```

npm run build

```
# Usage
1. Install the [CeloExtensionWallet](https://chrome.google.com/webstore/detail/celoextensionwallet/kkilomkmpmkbdnfelcpgckmpcaemjcdh?hl=en) from the google chrome store.
2. Create a wallet.
3. Go to [https://celo.org/developers/faucet](https://celo.org/developers/faucet) and get tokens for the alfajores testnet.
4. Switch to the alfajores testnet in the CeloExtensionWallet