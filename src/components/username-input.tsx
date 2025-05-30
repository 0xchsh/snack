"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { AtSign, Check, X } from "lucide-react"
import { Input } from "@/components/ui/input"

interface UsernameInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  helperText?: string
  onValidationChange?: (isValid: boolean) => void
  available?: boolean
}

const UsernameInput = React.forwardRef<HTMLInputElement, UsernameInputProps>(
  ({ className, label = "Username", helperText, onValidationChange, available, ...props }, ref) => {
    const [value, setValue] = React.useState<string>(props.defaultValue as string || "")
    const [isFocused, setIsFocused] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)
    const [isValid, setIsValid] = React.useState(false)
    const inputRef = React.useRef<HTMLInputElement>(null)

    React.useImperativeHandle(ref, () => inputRef.current!)

    const validateUsername = (username: string) => {
      if (!username) {
        setError("Username is required")
        setIsValid(false)
        return false
      }
      
      if (username.length < 3) {
        setError("Username must be at least 3 characters")
        setIsValid(false)
        return false
      }
      
      if (username.length > 20) {
        setError("Username must be less than 20 characters")
        setIsValid(false)
        return false
      }
      
      if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
        setError("Username can only contain letters, numbers, underscores, dots, and hyphens")
        setIsValid(false)
        return false
      }
      
      setError(null)
      setIsValid(true)
      return true
    }

    React.useEffect(() => {
      if (value) {
        validateUsername(value)
      } else {
        setError(null)
        setIsValid(false)
      }
      
      onValidationChange?.(isValid)
    }, [value, isValid, onValidationChange])

    const handleClear = () => {
      setValue("")
      setError(null)
      setIsValid(false)
      inputRef.current?.focus()

      // Trigger change event
      const event = new Event("change", { bubbles: true })
      inputRef.current?.dispatchEvent(event)
    }

    // Determine color state
    let colorState: 'green' | 'red' | 'gray' = 'gray';
    if (value && (error || available === false)) colorState = 'red';
    else if (value && isValid && available) colorState = 'green';
    else if (value && isValid && available === undefined) colorState = 'green'; // fallback for no availability check

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            className="text-sm font-medium text-foreground/90"
            htmlFor={props.id}
          >
            {label}
          </label>
        )}

        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <AtSign className="h-4 w-4" />
          </div>
          
          <input
            type="text"
            className={cn(
              "w-full pl-10 pr-10 py-2 rounded-lg",
              "bg-background",
              "border",
              colorState === 'red' && "border-destructive focus:ring-destructive/20",
              colorState === 'green' && "border-green-500 focus:ring-green-500/20",
              colorState === 'gray' && "border-input focus:ring-primary/20",
              isFocused && colorState === 'gray' && "border-primary",
              "text-sm text-foreground",
              "placeholder:text-muted-foreground",
              "transition-all duration-200",
              "focus:outline-none focus:ring-2",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              className,
            )}
            ref={inputRef}
            onChange={(e) => {
              setValue(e.target.value)
              props.onChange?.(e)
            }}
            onFocus={(e) => {
              setIsFocused(true)
              props.onFocus?.(e)
            }}
            onBlur={(e) => {
              setIsFocused(false)
              if (value) {
                validateUsername(value)
              }
              props.onBlur?.(e)
            }}
            value={value}
            {...props}
          />

          {/* Clear button */}
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className={cn(
                "absolute right-2 top-1/2 -translate-y-1/2",
                "p-1 rounded-md",
                "text-muted-foreground hover:text-foreground",
                "transition-colors",
              )}
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {/* Status indicator */}
          {(error || isValid) && value && (
            <div className="absolute -right-6 top-1/2 -translate-y-1/2">
              {error || available === false ? (
                <X className="h-4 w-4 text-destructive" />
              ) : (
                <Check className="h-4 w-4 text-green-500" />
              )}
            </div>
          )}
        </div>

        {/* Error/Helper message */}
        {(error || helperText) && (
          <p
            className={cn(
              "text-xs",
              colorState === 'red' && "text-destructive",
              colorState === 'green' && "text-green-600",
              colorState === 'gray' && "text-muted-foreground",
            )}
          >
            {error || helperText}
          </p>
        )}
      </div>
    )
  },
)
UsernameInput.displayName = "UsernameInput"

export { UsernameInput } 