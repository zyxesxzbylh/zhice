/**
 * UI primitives barrel.
 *
 * Import the design-system building blocks from here:
 *   import { Button, Modal, Input, Card, Tag, EmptyState } from "@/components/ui";
 */

export { Button } from "./Button";
export type { ButtonProps, ButtonVariant, ButtonSize } from "./Button";

export { Input } from "./Input";
export type { InputProps } from "./Input";

export { Textarea } from "./Textarea";
export type { TextareaProps } from "./Textarea";

export { Select } from "./Select";
export type { SelectProps, SelectOption } from "./Select";

export { Card } from "./Card";
export type { CardProps, CardVariant } from "./Card";

export { Modal } from "./Modal";
export type { ModalProps, ModalSize } from "./Modal";

export { Spinner, LabeledSpinner } from "./Spinner";
export type { SpinnerProps, LabeledSpinnerProps, SpinnerSize } from "./Spinner";

export { Badge } from "./Badge";
export type { BadgeProps, BadgeTone } from "./Badge";

export { IconButton } from "./IconButton";
export type { IconButtonProps, IconButtonVariant, IconButtonSize } from "./IconButton";

export { Toggle } from "./Toggle";
export type { ToggleProps } from "./Toggle";

export { Tabs, TabsList, Tab, TabPanel } from "./Tabs";
export type { TabsProps, TabsListProps, TabProps, TabPanelProps } from "./Tabs";

export { toast$ } from "./Toast";
export type { ToastDuration, ToastOptions } from "./Toast";

export { Tag, TagSwatch, TagList } from "./Tag";
export type { TagProps, TagSwatchProps, TagListProps, TagVariant } from "./Tag";

export { EmptyState } from "./EmptyState";
export type { EmptyStateProps, EmptyStateIcon } from "./EmptyState";
