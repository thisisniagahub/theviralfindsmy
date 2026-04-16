/** Custom error class for environment validation failures */

export class EnvValidationError extends Error {
  public missingVars: string[]

  constructor(missingVars: string[]) {
    const message = `Environment validation failed: missing or invalid variables: ${missingVars.join(', ')}`
    super(message)
    this.name = 'EnvValidationError'
    this.missingVars = missingVars
  }
}
