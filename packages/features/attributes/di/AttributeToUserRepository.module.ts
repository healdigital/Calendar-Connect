import { bindModuleToClassOnToken, createModule, type ModuleLoader } from "@calcom/features/di/di";
import { moduleLoader as prismaModuleLoader } from "@calcom/features/di/modules/Prisma";
import { PrismaAttributeToUserRepository } from "../repositories/PrismaAttributeToUserRepository";
import { ATTRIBUTE_DI_TOKENS } from "./tokens";

const token = ATTRIBUTE_DI_TOKENS.ATTRIBUTE_TO_USER_REPOSITORY;
const moduleToken = ATTRIBUTE_DI_TOKENS.ATTRIBUTE_TO_USER_REPOSITORY_MODULE;
const attributeToUserRepositoryModule = createModule();
const loadModule = bindModuleToClassOnToken({
  module: attributeToUserRepositoryModule,
  moduleToken,
  token,
  classs: PrismaAttributeToUserRepository,
  dep: prismaModuleLoader,
});

const moduleLoader: ModuleLoader = {
  token,
  loadModule,
};

export { attributeToUserRepositoryModule, moduleLoader };
export type { PrismaAttributeToUserRepository };
