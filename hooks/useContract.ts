import { useState, useEffect } from "react"
import { useNetworkVariable } from "@/lib/config"
import {
  useCurrentAccount,
  useIotaClient,
  useSignAndExecuteTransaction,
  useIotaClientQuery,
} from "@iota/dapp-kit"
import { Transaction } from "@iota/iota-sdk/transactions"
import { IotaObjectData } from "@iota/iota-sdk/client"

export const CONTRACT_MODULE = "contract"
export const CONTRACT_METHODS = {
  CREATE: "create",
  ADD_INVENTORY: "add_inventory",
  REMOVE_INVENTORY: "remove_inventory",
} as const

function getObjectFields(data: IotaObjectData): { inventory_count: number; owner: string } | null {
  if (data.content?.dataType !== "moveObject") {
    return null
  }
  const fields = data.content.fields as any
  if (!fields) return null

  let inventory_count: number
  if (typeof fields.inventory_count === "string") {
    inventory_count = parseInt(fields.inventory_count, 10)
    if (isNaN(inventory_count)) {
      return null
    }
  } else if (typeof fields.inventory_count === "number") {
    inventory_count = fields.inventory_count
  } else {
    return null
  }
  if (!fields.owner) {
    return null
  }
  const owner = String(fields.owner)
  return {
    inventory_count,
    owner,
  }
}

export interface ContractData {
  inventory_count: number
  owner: string
}

export interface ContractActions {
  createObject: () => Promise<void>
  add_inventory: () => Promise<void>
  remove_inventory: () => Promise<void>
  clearObject: () => void
}

export const useContract = () => {
  const currentAccount = useCurrentAccount()
  const iotaClient = useIotaClient()
  const { mutate: signAndExecute } = useSignAndExecuteTransaction()
  const [objectId, setObjectId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [hash, setHash] = useState<string | null>(null)
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [transactionError, setTransactionError] = useState<Error | null>(null)

  const packageId = useNetworkVariable("packageId")

  const { data, refetch } = useIotaClientQuery(
    ["object", objectId],
    () => iotaClient.getObject({ id: objectId! }),
    {
      enabled: !!objectId && !!packageId,
      retry: false,
    }
  )

  useEffect(() => {
    if (data?.data) {
      setIsConfirmed(true)
    }
  }, [data])

  const fields = data?.data ? getObjectFields(data.data as IotaObjectData) : null

  const createObject = async () => {
    if (!packageId) return
    try {
      setIsLoading(true)
      setTransactionError(null)
      const tx = new Transaction()
      tx.moveCall({
        arguments: [],
        target: `${packageId}::${CONTRACT_MODULE}::${CONTRACT_METHODS.CREATE}`,
      })
      signAndExecute(
        { transaction: tx },
        {
          onSuccess: async ({ digest }) => {
            setHash(digest)
            await iotaClient.waitForTransaction({ digest })
            const txResponse = await iotaClient.getTransactionBlock({ digest })
            const createdObjects = txResponse.effects?.created || []
            if (createdObjects.length > 0) {
              setObjectId(createdObjects[0].reference.objectId)
            }
            await refetch()
            setIsLoading(false)
          },
          onError: (err) => {
            const error = err instanceof Error ? err : new Error(String(err))
            setTransactionError(error)
            console.error("Error:", err)
            setIsLoading(false)
          },
        }
      )
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setTransactionError(error)
      console.error("Error creating object:", err)
      setIsLoading(false)
    }
  }

  const add_inventory = async () => {
    if (!objectId || !packageId) return
    try {
      setIsLoading(true)
      setTransactionError(null)
      const tx = new Transaction()
      tx.moveCall({
        arguments: [tx.object(objectId)],
        target: `${packageId}::${CONTRACT_MODULE}::${CONTRACT_METHODS.ADD_INVENTORY}`,
      })
      signAndExecute(
        { transaction: tx },
        {
          onSuccess: async ({ digest }) => {
            setHash(digest)
            await iotaClient.waitForTransaction({ digest })
            await refetch()
            setIsLoading(false)
          },
          onError: (err) => {
            const error = err instanceof Error ? err : new Error(String(err))
            setTransactionError(error)
            console.error("Error:", err)
            setIsLoading(false)
          },
        }
      )
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setTransactionError(error)
      console.error("Error adding item:", err)
      setIsLoading(false)
    }
  }

  const remove_inventory = async () => {
    if (!objectId || !packageId) return
    try {
      setIsLoading(true)
      setTransactionError(null)
      const tx = new Transaction()
      tx.moveCall({
        arguments: [tx.object(objectId)],
        target: `${packageId}::${CONTRACT_MODULE}::${CONTRACT_METHODS.REMOVE_INVENTORY}`,
      })
      signAndExecute(
        { transaction: tx },
        {
          onSuccess: async ({ digest }) => {
            setHash(digest)
            await iotaClient.waitForTransaction({ digest })
            await refetch()
            setIsLoading(false)
          },
          onError: (err) => {
            const error = err instanceof Error ? err : new Error(String(err))
            setTransactionError(error)
            console.error("Error:", err)
            setIsLoading(false)
          },
        }
      )
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setTransactionError(error)
      console.error("Error removing item:", err)
      setIsLoading(false)
    }
  }

  const clearObject = () => {
    setObjectId(null)
    setHash(null)
    setIsConfirmed(false)
    setError(null)
    setTransactionError(null)
  }

  const contractData: ContractData | null = fields
    ? {
        inventory_count: fields.inventory_count,
        owner: fields.owner,
      }
    : null

  const actions: ContractActions = {
    createObject,
    add_inventory,
    remove_inventory,
    clearObject,
  }

  const objectExists = !!data?.data
  const hasValidData = !!fields
  const isOwner = fields?.owner === currentAccount?.address

  return {
    data: contractData,
    actions,
    state: {
      isLoading,
      isPending,
      error: error || transactionError,
      hash,
      isConfirmed,
    },
    objectId,
    isOwner,
    objectExists,
    hasValidData,
  }
}

