"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Plus, Loader2 } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { insertChannelSchema } from "@/lib/db/schema/channels"
import type { NewChannel } from "@/lib/db/schema/channels"
import { useToast } from "@/components/ui/use-toast"
import { Channel, CHANNEL_LABELS, CHANNEL_TYPES } from "@/lib/constants/channels"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { DingtalkFields } from "@/components/channel-form/dingtalk-fields"
import { WecomAppFields } from "@/components/channel-form/wecom-app-fields"
import { TelegramFields } from "@/components/channel-form/telegram-fields"
import { useRouter } from "next/navigation"
import { createChannel, updateChannel } from "@/lib/services/channels"

interface ChannelDialogProps {
  mode?: "create" | "edit"
  channel?: Channel
}

export function ChannelDialog({ mode = "create", channel }: ChannelDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const { toast } = useToast()
  const [selectedType, setSelectedType] = useState(channel?.type)
  const router = useRouter()

  const form = useForm<NewChannel>({
    resolver: zodResolver(insertChannelSchema),
    defaultValues: {
      name: channel?.name || "",
      type: channel?.type || CHANNEL_TYPES.DINGTALK,
      webhook: channel?.webhook || "",
      secret: channel?.secret || "",
      corpId: channel?.corpId || "",
      agentId: channel?.agentId || "",
      botToken: channel?.botToken || "",
      chatId: channel?.chatId || "",
    },
  })

  async function onSubmit(data: NewChannel) {
    console.log('onSubmit', data)
    try {
      setIsPending(true)
      if (mode === "edit" && channel) {
        await updateChannel(channel.id, data)
        toast({ description: "渠道已更新" })
      } else {
        await createChannel(data)
        toast({ description: "渠道已创建" })
      }
      setOpen(false)
      form.reset()
      router.refresh()
    } catch (error) {
      console.error('Channel dialog error:', error)
      toast({
        variant: "destructive",
        description: mode === "edit" ? "更新失败，请重试" : "创建失败，请重试" 
      })
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {mode === "edit" ? (
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            编辑
          </DropdownMenuItem>
        ) : (
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            添加新的渠道
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "编辑推送渠道" : "新建推送渠道"}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit" ? "修改现有的推送渠道" : "添加一个新的消息推送渠道"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    名称
                    <span className="text-red-500 ml-1">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="请输入渠道名称" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    类型
                    <span className="text-red-500 ml-1">*</span>
                  </FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value as keyof typeof CHANNEL_TYPES)
                      setSelectedType(value as any)
                    }}
                    value={selectedType}
                    disabled={mode === "edit"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="选择渠道类型" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(CHANNEL_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {selectedType === CHANNEL_TYPES.WECOM_APP ? (
              <WecomAppFields form={form} />
            ) : selectedType === CHANNEL_TYPES.DINGTALK ? (
              <DingtalkFields form={form} />
            ) : selectedType === CHANNEL_TYPES.TELEGRAM ? (
              <TelegramFields form={form} />
            ) : (
              <FormField
                control={form.control}
                name="webhook"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Webhook URL
                      <span className="text-red-500 ml-1">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="请输入 Webhook 地址" 
                        className="font-mono"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} type="button">
                取消
              </Button>
              <Button 
                type="submit"
                disabled={isPending}
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                提交
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 