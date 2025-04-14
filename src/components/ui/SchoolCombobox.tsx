import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface School {
  value: string
  label: string
}

interface SchoolComboboxProps {
  schools: School[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  notFoundMessage?: string
  allowCustom?: boolean
  disabled?: boolean
}

export function SchoolCombobox({
  schools,
  value,
  onChange,
  placeholder = "Select a school...",
  searchPlaceholder = "Search schools...",
  notFoundMessage = "No school found.",
  allowCustom = true,
  disabled = false,
}: SchoolComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState(value)

  // Update input value when value prop changes
  React.useEffect(() => {
    setInputValue(value)
  }, [value])

  // Handle custom input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    if (allowCustom) {
      onChange(newValue)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between bg-white/90 text-black h-11",
            !value && "text-muted-foreground"
          )}
          disabled={disabled}
        >
          {value
            ? schools.find((school) => school.value === value)?.label || value
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput 
            placeholder={searchPlaceholder} 
            value={inputValue}
            onValueChange={setInputValue}
            onInput={handleInputChange}
            className="h-9"
          />
          <CommandEmpty>{notFoundMessage}</CommandEmpty>
          <CommandGroup className="max-h-60 overflow-auto">
            {schools.map((school) => (
              <CommandItem
                key={school.value}
                value={school.value}
                onSelect={(currentValue) => {
                  onChange(currentValue === value ? "" : currentValue)
                  setOpen(false)
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === school.value ? "opacity-100" : "opacity-0"
                  )}
                />
                {school.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
