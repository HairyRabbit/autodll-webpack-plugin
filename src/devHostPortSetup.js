/**
 * setup host and port, failback to default options
 *
 * @flow
 */

type Host = string
type Port = string

const DefaultHost: Host = 'localhost'
const DefaultPort: Port = '8080'

export default function setupHostPort(userHost: ?Host,
                                      userPort: ?Port,
                                      options: Object = {}): [Host, Port] {
  const host = userHost || options.host || DefaultHost
  const port = userPort || options.port || DefaultPort
  return [host, port]
}
