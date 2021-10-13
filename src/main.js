import Web3 from "web3"
import { newKitFromWeb3 } from "@celo/contractkit"
import BigNumber from "bignumber.js"
import tasksAbi from '../contract/tasks.abi.json'
import erc20Abi from "../contract/erc20.abi.json"


const ERC20_DECIMALS = 18
const cUSDContractAddress = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1"
// const tasksContractAddress = "0x6E8F940979df2CcA16866b5c570C3F02C95F52e4"
const tasksContractAddress = "0x81fC34bF1Cc162b6d52f85fAC4Aa8cdEf9eFc82D"

let kit
let contract
let tasks = []


const active = 0
const locked = 1
const complete = 2 
const annuled = 3

  const connectCeloWallet = async function (){
    if (window.celo) {
       notification("⚠️ Please approve this DApp to use it.")
        try {
          await window.celo.enable()
          notificationOff()

          const web3 = new Web3(window.celo)
          kit = newKitFromWeb3(web3)

          const accounts = await kit.web3.eth.getAccounts()
          kit.defaultAccount = accounts[0]

          contract = new kit.web3.eth.Contract(tasksAbi, tasksContractAddress)
        }
        catch (error) {
          notification(`⚠️ ${error}.`)
        }
      }
      else{
          notification("⚠️ Please install the CeloExtensionWallet.")
        }
    }

    async function approve(_price){
      const cUSDContract = new kit.web3.eth.Contract(erc20Abi, cUSDContractAddress)
    
      const result = await cUSDContract.methods
            .approve(tasksContractAddress, _price)
            .send({ from: kit.defaultAccount })
        return result
    }
  


  const getBalance = async function() {
    const totalBalance = await kit.getTotalBalance(kit.defaultAccount)
    const cUSDBalance = totalBalance.cUSD.shiftedBy(-ERC20_DECIMALS).toFixed(2)
  	document.querySelector("#balance").textContent = cUSDBalance
  }

  const getTasks = async function() {
      const _taskslength = await contract.methods.getTaskLength().call()
      const _tasks = []
  
      for (let i = 0; i < _taskslength; i++){
        let _product = new Promise(async (resolve, reject) => {
          let p = await contract.methods.getTaskInfo(i).call()
          resolve({
            index: i,
            owner: p[0],
            locker: p[1],
            taskdesc: p[2],
            proof: p[3],
            contact: p[4],
            prize: new BigNumber(p[5]),
            duration: p[6],
            startime: p[7],
            lockcost: new BigNumber(p[8]),
            state: p[9]
          })
        })
        _tasks.push(_product)
      }
      tasks = await Promise.all(_tasks)
      
      renderTasks(tasks)
  }

  // function filterTasks()

  function renderTasks(tasks) {
    let notannuledtasks = tasks.filter(t => t.state != annuled)
  	document.getElementById("listings").innerHTML = ""
  	notannuledtasks.forEach((_task) => {
  		const newDiv = document.createElement("div")
  		newDiv.className = "col-md-6"
  		newDiv.innerHTML = taskTemplate(_task)
  		document.getElementById("listings").appendChild(newDiv)
  	})
  }

  function turnStateToString(stateint){
    if (stateint == active) return "active"
    else if (stateint == annuled) return "annuled"
    else if (stateint == complete) return "completed"
    else if (stateint == locked) return "locked"
  }

  function taskTemplate(_task) {
    let buttons = []
    buttons[active] = `<a class="btn  btn-primary" data-action="lock" id="${_task.index}">
                    Lock in task for ${new BigNumber(_task.lockcost).shiftedBy(-ERC20_DECIMALS).toFixed(2)} cUSD </a>`
    buttons[locked] = `<a class="btn  btn-danger .disabled" id="${_task.index}">
            task locked by ${identiconImg(_task.locker, 24)}</a>`
    let completebtn = `<a class="btn  btn-success .completeBtn" data-action="complete" id="${_task.index}">
              Mark as Completed</a>` 
    let annulbtn = `<a class="btn  btn-danger .annulBtn" data-action="annul" id="${_task.index}">
            Unlist Task</a>`
    let unlocktask = `<a class="btn  btn-danger .unlockBtn" data-action="unlock" id="${_task.index}">
            Unlock Task</a>` 

    let isowner = _task.owner === kit.defaultAccount                   
  	return `
    <div class="card mb-4">
      <div class="card-body text-left p-4 position-relative">
        <!-- <div class="translate-middle-y position-absolute top-0"> -->    
        ${identiconTemplate(_task.owner)}
        <!-- </div> -->
        <h5 class="card-title">Task Description</h5>
        <p class="card-text mb-1">
          ${_task.taskdesc}         
        </p>
        <h5 class="card-title "> Expected Deliverables</h5>
        <p>${_task.proof} </p>
        <p> Task Prize: ${new BigNumber(_task.prize).shiftedBy(-ERC20_DECIMALS).toFixed(2)} cUSD <br>Contact Info: ${_task.contact} 
        <br>Lock Duration: ${_task.duration / 3600} hour(s)
        <br><span class="badge ${_task.state == 1? "bg-danger":"bg-secondary"}">${turnStateToString(_task.state)}</span>
        </p>

        <div class="">
          ${!isowner ? _task.state == 0 ? buttons[_task.state]: "":""}

          ${isowner ? _task.state == 0? annulbtn: "":""}
          ${isowner ? _task.state == 1? completebtn + unlocktask: "":""}
        </div>
      </div>
    </div>
  `
}
  function identiconTemplate(_address) {
	return `
	  <div class="rounded-circle overflow-hidden d-inline-block border border-white border-2 shadow-sm m-0">
	    <a href="https://alfajores-blockscout.celo-testnet.org/address/${_address}/transactions"
	        target="_blank">
	        ${identiconImg(_address)}
	    </a>
	  </div>
	  `  	
  }

  function identiconImg(_address, size=48){
    const icon = blockies
    .create({
      seed: _address,
      size: 8,
      scale: 16,
    })
    .toDataURL()

    return `<img src="${icon}" width="${size}" alt="${_address}">`
  }

  function notification(_text) {
	  document.querySelector(".alert").style.display = "block"
	  document.querySelector("#notification").textContent = _text
	}

  function notificationOff() {
	  document.querySelector(".alert").style.display = "none"
	}

  window.addEventListener("load", async () => {
    notification("⌛ Loading...")
    await connectCeloWallet()
    await getBalance()
    await getTasks()
    notificationOff()
	})

  // filter tasks based on different criteria
  document.querySelector("#filters").addEventListener("click", (e) => {
  let filteredtasks = tasks
  if (e.target.dataset.option == "ownedTasks"){
    filteredtasks = filteredtasks.filter(t => t.owner == kit.defaultAccount)
  }
  
  if (e.target.dataset.option == "lockedTasks"){
    filteredtasks = filteredtasks.filter(t => t.locker == kit.defaultAccount)
  }

  renderTasks(filteredtasks)


})
  const delay = ms => new Promise(res => setTimeout(res, ms));

  // watch for the various valid actions
  document.querySelector("#listings").addEventListener("click", async (e) => {
  // lock button
  if(e.target.dataset.action == "lock") {
    const index = e.target.id
    notification("⌛ Waiting for payment approval...")
    try {
      await approve(tasks[index].lockcost)
    } 
    catch (error) {
      notification(`didnt approve ⚠️ ${error}.`)
    }
  
    try {
      const result = await contract.methods
        .lockTask(index)
        .send({from: kit.defaultAccount })
      notification(`🎉 task ${index} has been locked for ${tasks[index].duration / 3600} hours ".`)
      getTasks()
      getBalance()

      await delay(4000)
        notificationOff()
    }
    catch (error) {
        notification(`${error}.`) 
    }
  } 

  else if (e.target.dataset.action == "complete"){
    const index = e.target.id
    try {
        const result = await contract.methods
          .completeTask(index)
          .send({from: kit.defaultAccount })
        notification(`🎉 task ${index} has been completed.`)
        getTasks()
        getBalance()

        await delay(4000)
        notificationOff()

      }
    catch (error) {
        notification(`${error}.`)
    } 
  }

  else if (e.target.dataset.action == "unlock"){
    const index = e.target.id
    // check for elapsed time period 
    let timehaselapsed = tasks[index].startime + tasks[index].duration * 3600 <= Date.now() / 1000
    if (!timehaselapsed){
      notification("Can not unlock yet, lock period has not yet elapsed")
      return
    }

    try {
        const result = await contract.methods
          .setBackToActive(index)
          .send({from: kit.defaultAccount })
        notification(`🎉 task ${index} has been unlocked.`)
        
        getTasks()
        getBalance()
       await delay(4000)
        notificationOff()

      }
    catch (error) {
        notification(`${error}.`)
    
    } 

  }

  else if (e.target.dataset.action == "annul"){
    const index = e.target.id
    try {
        const result = await contract.methods
          .annulTask(index)
          .send({from: kit.defaultAccount })
        notification(`🎉 task ${index} has been annuled.`)
        getTasks()
        getBalance()
       await delay(4000)
        notificationOff()
      }
    catch (error) {
        notification(`${error}.`)
    
    } 

  }
})

  document.querySelector("#newTaskBtn").addEventListener("click", async (e) => {
    let prize = document.getElementById("newTaskPrize").value
    prize = Math.abs(parseInt(prize))
    prize = new BigNumber(prize).shiftedBy(ERC20_DECIMALS)
                                .toString()

    const params = [
      document.getElementById("newTaskDesc").value,
      document.getElementById("newProof").value,
      document.getElementById("contactinfo").value,
      prize,
      document.getElementById("lockDuration").value
      
    ]
    notification(`⌛ Adding your task...`)

    try {
      await approve(prize)
    }
    catch (error) {
      notification(`didnt approve ⚠️ ${error}.`)
    }

    try {
      const result = await contract.methods
          .addTask(...params)
          .send({from: kit.defaultAccount })
    }
    catch (error){
      notification(`⚠️ ${error}.`)
    }
    notification(`🎉 You successfully added your task`)
    getTasks()
  })


