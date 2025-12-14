import { useCurrentAccount } from "@iota/dapp-kit"
import { useContract } from "@/hooks/useContract"
import { Button, Container, Flex, Heading, Text } from "@radix-ui/themes"
import ClipLoader from "react-spinners/ClipLoader"

const SampleIntegration = () => {
  const currentAccount = useCurrentAccount()
  const { data, actions, state, objectId, isOwner, objectExists, hasValidData } = useContract()

  const isConnected = !!currentAccount

  if (!isConnected) {
    return (
      <div style={{}}>
        <div style={{}}>
          <Heading size="6" style={{}}>IOTA dApp</Heading>
          <Text>Please connect your wallet to interact with the contract.</Text>
        </div>
      </div>
    )
  }

  return (
    <div style={{}}>
      <Container style={{}}>
        <Heading size="6" style={{}}>IOTA Inventory Tracker dApp</Heading>

        {!objectId ? (
          <div>
            <Button size="3" onClick={actions.createObject} disabled={state.isPending}>
              {state.isPending ? (
                <>
                  <ClipLoader size={16} style={{}} />
                  Creating...
                </>
              ) : (
                "Create Inventory Tracker"
              )}
            </Button>
            {state.error && (
              <div style={{}}>
                <Text style={{}}>
                  Error: {(state.error as Error)?.message || String(state.error)}
                </Text>
              </div>
            )}
          </div>
        ) : (
          <div>
            {state.isLoading && !data ? (
              <Text>Loading object...</Text>
            ) : state.error ? (
              <div style={{}}>
                <Text style={{}}>
                  Error loading object
                </Text>
                <Text size="2" style={{}}>
                  {state.error.message || "Object not found or invalid"}
                </Text>
                <Text size="1" style={{}}>
                  Object ID: {objectId}
                </Text>
                <Button size="2" variant="soft" onClick={actions.clearObject} style={{}}>
                  Clear & Create New
                </Button>
              </div>
            ) : objectExists && !hasValidData ? (
              <div style={{}}>
                <Text style={{}}>
                  Object found but data structure is invalid. Please check the contract structure.
                </Text>
                <Text size="1" style={{}}>
                  Object ID: {objectId}
                </Text>
              </div>
            ) : data ? (
              <div>
                <div style={{}}>
                  <Text size="2" style={{}}>Inventory Count</Text>
                  <Heading size="8">{data.inventory_count}</Heading>
                  <Text size="1" style={{}}>
                    Object ID: {objectId}
                  </Text>
                </div>

                <Flex gap="2" style={{}}>
                  <Button onClick={actions.add_inventory} disabled={state.isLoading || state.isPending}>
                    {state.isLoading || state.isPending ? <ClipLoader size={16} /> : "Add Item"}
                  </Button>
                  {isOwner && (
                    <Button onClick={actions.remove_inventory} disabled={state.isLoading || state.isPending}>
                      {state.isLoading || state.isPending ? <ClipLoader size={16} /> : "Remove Item"}
                    </Button>
                  )}
                </Flex>

                {state.hash && (
                  <div style={{}}>
                    <Text size="1" style={{}}>Transaction Hash</Text>
                    <Text size="2" style={{}}>{state.hash}</Text>
                    {state.isConfirmed && (
                      <Text size="2" style={{}}>
                        Transaction confirmed!
                      </Text>
                    )}
                  </div>
                )}

                {state.error && (
                  <div style={{}}>
                    <Text style={{}}>
                      Error: {(state.error as Error)?.message || String(state.error)}
                    </Text>
                  </div>
                )}
              </div>
            ) : (
              <div style={{}}>
                <Text style={{}}>Object not found</Text>
                <Text size="1" style={{}}>
                  Object ID: {objectId}
                </Text>
                <Button size="2" variant="soft" onClick={actions.clearObject} style={{}}>
                  Clear & Create New
                </Button>
              </div>
            )}
          </div>
        )}
      </Container>
    </div>
  )
}

export default SampleIntegration
